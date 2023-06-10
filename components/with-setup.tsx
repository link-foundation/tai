import { DeepClient, useDeep } from '@deep-foundation/deeplinks/imports/client';
import { useState, useEffect } from 'react';
import { Setup } from './login';

export function WithSetup({
  renderChildren,
  gqlPath,
  setGqlPath
}: LoginOrContentParam) {
  const deep = useDeep();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    self['deep'] = deep;
    if (deep.linkId !== 0) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, [deep]);

  console.log({ isAuthorized, gqlPath });
  return isAuthorized && gqlPath ? (
    renderChildren({deep})
  ) : (
    <Setup
    onAuthorize={(arg)=>{
      console.log({ arg });
      setGqlPath(arg.gqlPath);
      deep.login({
        token: arg.token,
      });
    }}
    />
  );
}

export interface LoginOrContentParam {
  gqlPath: string | undefined;
  setGqlPath: (gqlPath: string | undefined) => void;
  renderChildren: (param: { deep: DeepClient }) => JSX.Element;
}
