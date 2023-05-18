import { Card, CardHeader, Heading, CardBody, FormControl, FormLabel, Input, Button, Alert, AlertTitle, AlertIcon, Text, AlertDescription } from "@chakra-ui/react";
import { useState } from "react";
import { useDeep } from "@deep-foundation/deeplinks/imports/client";
import { useLocalStore } from "@deep-foundation/store/local";
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { WithPackagesInstalled } from '@deep-foundation/react-with-packages-installed';
export function Setup(arg: {
  onAuthorize: (arg: { gqlPath: string, token: string }) => void,
  onSubmit: (arg: { apiKey: string, googleAuth: string, systemMsg: string  }) => void
}) {
  // const defaultGqlPath = "3006-deepfoundation-dev-mst16p4n7jz.ws-eu96b.gitpod.io/gql";
  // const defaultToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsiYWRtaW4iXSwieC1oYXN1cmEtZGVmYXVsdC1yb2xlIjoiYWRtaW4iLCJ4LWhhc3VyYS11c2VyLWlkIjoiMzc4In0sImlhdCI6MTY4MzQ4MDUyMH0.rp9HzhnRMEA-hKf_2aReoJvBI6aSlItNSQ-cop58w5U";
  const deep = useDeep();
  const [gqlPath, setGqlPath] = useLocalStore<string>("gqlPath", "");
  const [token, setToken] = useLocalStore<string>("token", "");
  const [apiKey, setApiKey] = useLocalStore<string>("apikey", "");
  const [googleAuth, setGoogleAuth] = useLocalStore<string>("googleAuth", "");
  const [systemMsg, setSystemMsg] = useLocalStore<string>("systemMsg", "");
  const [isSendDataPressed, setIsSendDataPressed] = useState(false);
  const [arePermissionsGranted, setArePermissionsGranted] = useState<boolean>(false)
  const [isVoiceRecorderInstallStarted, setIsVoiceRecorderInstallStarted] = useState(false);
  const [isGoogleSpeechInstallStarted, setIsGoogleSpeechInstallStarted] = useState(false);
  const [isChatGPTInstallStarted, setIsChatGPTInstallStarted] = useState(false);
  const [installedPackages, setInstalledPackages] = useState({
    "@deep-foundation/capacitor-voice-recorder": false,
    "@deep-foundation/google-speech": false,
    "@deep-foundation/chatgpt": false,
  });

  const [deviceLinkId, setDeviceLinkId] = useLocalStore(
    'deviceLinkId',
    undefined
  );

  const installPackage = async (packageName) => {
    console.log(`Installing ${packageName}`, installedPackages[packageName]);
    if (!installedPackages[packageName]) {
      switch (packageName) {
        case "@deep-foundation/capacitor-voice-recorder":
          setIsVoiceRecorderInstallStarted(true);
          break;
        case "@deep-foundation/google-speech":
          setIsGoogleSpeechInstallStarted(true);
          break;
        case "@deep-foundation/chatgpt":
          setIsChatGPTInstallStarted(true);
          break;
        default:
          break;
      }
      await deep.insert([
        {
          type_id: await deep.id('@deep-foundation/npm-packager', 'Install'),
          from_id: deep.linkId,
          to: {
            data: {
              type_id: await deep.id('@deep-foundation/core', 'PackageQuery'),
              string: { data: { value: packageName } }
            }
          },
        }
      ]);
  
      let packageLinkId;
      while (!packageLinkId) {
        try {
          packageLinkId = await deep.id(packageName);
        } catch (error) {
          console.log(`Package ${packageName} not installed yet, retrying in 1 second...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      await deep.insert([
        {
          type_id: await deep.id("@deep-foundation/core", "Join"),
          from_id: packageLinkId,
          to_id: await deep.id('deep', 'users', 'packages'),
        },
        {
          type_id: await deep.id("@deep-foundation/core", "Join"),
          from_id: packageLinkId,
          to_id: await deep.id('deep', 'admin'),
        },
      ]);
  
      setInstalledPackages(prevPackages => ({
        ...prevPackages,
        [packageName]: true
    }));
  }
}


  const submitForm = async () => {
      arg.onSubmit({
        apiKey,
        googleAuth,
        systemMsg
      });
        const parsedGoogleAuth = JSON.parse(googleAuth);
        await deep.insert({
          type_id: await deep.id("@deep-foundation/google-speech", "GoogleCloudAuthFile"),
          object: { data: { value: parsedGoogleAuth } },
          in: {
            data: [
              {
                type_id: await deep.id("@deep-foundation/core", "Contain"),
                from_id: deep.linkId,
              }
            ]
          }
        });
        await deep.insert({
          type_id: await deep.id("@deep-foundation/openai", "ApiKey"),
          string: { data: { value: apiKey } },
          in: {
            data: [
              {
                type_id: await deep.id('@deep-foundation/core', "Contain"),
                from_id: deep.linkId,
              }]
          }
        });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <Heading>
            Setup
          </Heading>
        </CardHeader>
        <CardBody>
      <FormControl id="gql-path">
        <FormLabel>GraphQL Path</FormLabel>
        <Input type="text" onChange={(newGqlPath) => {
          setGqlPath(newGqlPath.target.value)
        }} />
      </FormControl>
      <FormControl id="token" >
        <FormLabel>Token</FormLabel>
        <Input type="text" onChange={(newToken) => {
          setToken(newToken.target.value)
        }} />
      </FormControl>
      <FormControl id="OpenAI API key">
        <FormLabel>Api key</FormLabel>
        <Input type="text" onChange={(newApiKey) => {
          setApiKey(newApiKey.target.value)
        }} />
      </FormControl>
      <FormControl id="Google Auth">
        <FormLabel>Google Auth</FormLabel>
        <Input type="text" onChange={(newGoogleAuth) => {
          setGoogleAuth(newGoogleAuth.target.value)
        }} />
        </FormControl>
      <FormControl id="System Message">
        <FormLabel>System Message</FormLabel>
        <Input type="text" onChange={(newSystemMsg) => {
          setSystemMsg(newSystemMsg.target.value)
        }} />
      </FormControl>
      <Button onClick={() => {
          arg.onAuthorize({
            gqlPath,
            token,
          })
          setTimeout(() => {
            setIsSendDataPressed(true)
          }, 3000);
        }}>
          Send Data
        </Button>
        <Button onClick={() => {
          submitForm();
        }}>
          Submit
        </Button>
        {isSendDataPressed && (
          <WithPackagesInstalled
          packageNames={["@deep-foundation/capacitor-voice-recorder", "@deep-foundation/google-speech","@deep-foundation/chatgpt"]}
          renderIfError={(error) => <div>{error.message}</div>}
          renderIfNotInstalled={(packageNames) => {          
            return (
              <div>
        {`Install these deep packages to proceed: ${packageNames.join(', ')}`}
        {!installedPackages["@deep-foundation/capacitor-voice-recorder"] && !isVoiceRecorderInstallStarted &&
          <Button onClick={() => installPackage("@deep-foundation/capacitor-voice-recorder")}>
            Install @deep-foundation/capacitor-voice-recorder
          </Button>
        }
        {!installedPackages["@deep-foundation/google-speech"] && !isGoogleSpeechInstallStarted &&
          <Button onClick={() => installPackage("@deep-foundation/google-speech")}>
            Install @deep-foundation/google-speech
          </Button>
        }
        {!installedPackages["@deep-foundation/chatgpt"] && !isChatGPTInstallStarted &&
          <Button onClick={() => installPackage("@deep-foundation/chatgpt")}>
            Install @deep-foundation/chatgpt
          </Button>
        }
      </div>
            );
          }}
          renderIfLoading={() => (
            <Text>Checking if deep packages are installed...</Text>
          )}
          shouldIgnoreResultWhenLoading={true}
        >
             {!arePermissionsGranted ? (
                <>
    <Button
        style={{ position: 'relative', zIndex: 1000 }}
        onClick={async () => {
            const { value: arePermissionsGranted } = await VoiceRecorder.requestAudioRecordingPermission();
            setArePermissionsGranted(arePermissionsGranted);
            setIsGetPermissionPressed(true);
        }}
    >
        GET RECORDING PERMISSION
        </Button>
                </> 
              ) : <></>}
            </WithPackagesInstalled>
        )}
      </CardBody>
    </Card>
  </>
);
}