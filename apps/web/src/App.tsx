import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import {
  SERVER_HELLO_EVENT,
  type ServerHelloEvent
} from '@catan/protocol';

type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export function App() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [helloEvent, setHelloEvent] = useState<ServerHelloEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      autoConnect: true
    });

    setStatus('connecting');
    setErrorMessage(null);

    socket.on('connect', () => {
      setStatus('connected');
      setErrorMessage(null);
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      setStatus('error');
      setErrorMessage(error.message);
    });

    socket.on(SERVER_HELLO_EVENT, (event: ServerHelloEvent) => {
      setHelloEvent(event);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <main style={{ fontFamily: 'sans-serif', margin: '2rem', lineHeight: 1.5 }}>
      <h1>OpenCatan</h1>
      <p>The monorepo base is running.</p>

      <section>
        <h2>Backend Connection</h2>
        <p>
          <strong>Status:</strong> {status}
        </p>
        <p>
          <strong>Server URL:</strong> {SERVER_URL}
        </p>
        {errorMessage ? (
          <p>
            <strong>Error:</strong> {errorMessage}
          </p>
        ) : null}
        {helloEvent ? (
          <div>
            <p>
              <strong>Message:</strong> {helloEvent.message}
            </p>
            <p>
              <strong>Placeholder Game:</strong> {helloEvent.gameName}
            </p>
            <p>
              <strong>Snapshot Status:</strong> {helloEvent.snapshot.status}
            </p>
          </div>
        ) : (
          <p>Waiting for the server hello event...</p>
        )}
      </section>
    </main>
  );
}
