import { useRouter } from 'next/router';
import React, { useState } from 'react';
import styles from '../styles/Home.module.css';
import { useMetaMask } from 'metamask-react';
import { flatFetch } from '../lib/flat-fetch';
import { signedFetch, loginUsingEthereumProvider } from '../lib/auth';

function JoinScreen(provider: any) {
  const router = useRouter();
  const [worldServer, setWorldServer] = useState<string | undefined>(
    'https://worlds-content-server.decentraland.org',
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  async function livekitConnect(provider: any, worldServer: string, worldName: string) {
    const aboutResponse = await flatFetch(`${worldServer}/world/${worldName}/about`);
    console.log(aboutResponse.text);
    if (aboutResponse.status === 200) {
      const url = JSON.parse(aboutResponse.text!)
        ['comms']['fixedAdapter'].replace('signed-login:', '')
        .replace('get-comms-adapter', 'cast-adapter');
      const identity = await loginUsingEthereumProvider(provider);
      const response = await signedFetch(
        url,
        identity.authChain,
        {
          method: 'POST',
        },
        {
          signer: 'dcl:explorer',
          intent: 'dcl:explorer:comms-handshake',
        },
      );

      if (response.status === 200) {
        console.log(response.text);
        return JSON.parse(response.text!);
      } else {
        let message = '';
        try {
          message = JSON.parse(response.text || '')?.message;
        } catch (e) {
          message = response.text || '';
        }
        throw Error(message);
      }
      // throw Error(`Failed to connect to LiveKit: ${JSON.stringify(response.text || response.json?.message)}`)
    } else if (aboutResponse.status === 404) {
      throw Error(`World ${worldName} not found`);
    }
    throw Error('An error has occurred');
  }

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const worldName = formData.get('worldName')?.toString();

    livekitConnect(provider, worldServer!, worldName!)
      .then(({ url, token }) => {
        router.push(`/custom?liveKitUrl=${url}&token=${token}`);
      })
      .catch((e: any) => setErrorMessage(e.message));
  };

  return (
    <form className={styles.tabContent} onSubmit={onSubmit}>
      <p style={{ marginTop: 0 }}>
        Connect LiveKit Meet with a custom server using LiveKit Cloud or LiveKit Server.
      </p>
      <input
        id="worldServer"
        name="worldServer"
        type="url"
        placeholder="World Server URL: https://worlds-content-server.decentraland.zone"
        value={worldServer}
        onChange={(e: any) => setWorldServer(e.target.value)}
        required
      />
      <input
        id="worldName"
        name="worldName"
        type="string"
        placeholder="World Name: <name>.dcl.eth"
        required
      />
      <hr
        style={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.15)', marginBlock: '1rem' }}
      />
      {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
      <button
        style={{ paddingInline: '1.25rem', width: '100%' }}
        className="lk-button"
        type="submit"
      >
        Connect
      </button>
    </form>
  );
}

const Home = () => {
  const { status, connect, ethereum } = useMetaMask();
  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <div className="header">
          <h2>Meet on DCL</h2>
          {status === 'initializing' && <div>Synchronisation with MetaMask ongoing...</div>}
          {status === 'unavailable' && <div>MetaMask not available :</div>}
          {status === 'notConnected' && <button onClick={connect}>Connect to MetaMask</button>}
          {status === 'connecting' && <div>Connecting...</div>}
          {status === 'connected' && JoinScreen(ethereum)}
        </div>
      </main>
    </>
  );
};

export default Home;
