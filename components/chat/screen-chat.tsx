import React, { useEffect, useState } from 'react';
import { Box, IconButton, Text } from '@chakra-ui/react';
import { TfiClose } from 'react-icons/tfi';
import { Message } from './message';


export const ScreenChat = React.memo<any>(({ newConversationLinkId, deep, handleCloseChat }) => {
  const [messages, setMessages] = useState<Array<any>>([]);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [chatGptLinkId, setChatGptLinkId] = useState(null);

  useEffect(() => {
    const fetchChatGptLinkId = async () => {
      const id = await deep.id('@deep-foundation/chatgpt', 'ChatGPT');
      setChatGptLinkId(id);
    };

    fetchChatGptLinkId(); 
  }, [deep]);
  
  useEffect(() => {
    const fetchMessages = async () => {
      const messagingTreeId = await deep.id("@deep-foundation/messaging", "MessagingTree");
      const messageTypeLinkId = await deep.id("@deep-foundation/messaging", "Message");
      const authorTypeLinkId = await deep.id("@deep-foundation/messaging", "Author");
      const result = await deep.select({
        tree_id: { _eq: messagingTreeId },
        link: { type_id: { _eq: messageTypeLinkId } },
        root_id: { _eq: newConversationLinkId },
        // @ts-ignore
        self: { _eq: true }
      }, {
        table: 'tree',
        variables: { order_by: { depth: "asc" } },
        returning: `
          id
          depth
          root_id
          parent_id
          link_id
          link {
            id
            from_id
            type_id
            to_id
            value
            author: out (where: { type_id: { _eq: ${authorTypeLinkId}} }) {
              id
              from_id
              type_id
              to_id
            }
          }`
      });
      const lastMessage = result?.data[result.data.length - 1];

      if (lastMessage?.link?.author?.[0]?.to_id !== chatGptLinkId) {
        setIsWaitingResponse(true);
      } else {
        setIsWaitingResponse(false);
      }      

      setMessages(result?.data);
    };
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 1000);
    return () => clearInterval(intervalId);
  }, [newConversationLinkId, chatGptLinkId]);
  return (
    <Box
      display="flex"
      flexDirection="column"
      position="fixed"
      bottom={0}
      left={0}
      zIndex={1000}
      overflowY="scroll"
      height='30vh'
      width='100vw'
      bg='#03001da8'
      p={3}
      _before={{ content: '""', position: 'absolute', top: 0, left: 0, width: 0, borderTop: '1.5rem solid #0c3b01', borderRight: '1.5rem solid transparent' }}
      _after={{ content: '""', position: 'absolute', top: 0, right: 0, width: 0, borderTop: '1.5rem solid #0c3b01', borderLeft: '1.5rem solid transparent' }}
      sx={{
        '& > *:not(:last-child)': {
          mb: '1rem',
        },
      }}
      >
      <Box position="absolute" right={3} top={3}>
        <IconButton variant='outline' borderColor='#909294' aria-label='Close chat' isRound icon={<TfiClose color='#909294' />} onClick={handleCloseChat} />
      </Box>
      {messages.length ? [<Text key="header" fontWeight="bold" align='center' fontSize="lg" color='#deffee'>Online consultant</Text>] : null}
      {messages.map((message, index) => (
        <Message key={message.id}
          text={message?.link?.value?.value}
          align={message?.link?.author?.[0]?.to_id === chatGptLinkId ? 'left' : 'right'}
          arrow={message?.link?.author?.[0]?.to_id === chatGptLinkId ? 'left' : 'right'}
          fill={message?.link?.author?.[0]?.to_id === chatGptLinkId ? '#dcdcdc' : '#cce4ff'}
        />
      ))}
{isWaitingResponse && messages.length > 0 && (
  <Message
    text="Thinking..."
    align='left'
    arrow='left'
    fill='#dcdcdc'
  />
)}
    </Box>
  );
});

