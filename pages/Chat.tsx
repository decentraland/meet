import type { ChatMessage, ReceivedChatMessage } from '@livekit/components-core';
import { ChatEntry, MessageFormatter, useRoomContext } from '@livekit/components-react';
import { Participant, Room, RoomEvent } from 'livekit-client';
import * as React from 'react';
import type { Observable } from 'rxjs';
import { DataPacket_Kind } from 'livekit-client';
import { BehaviorSubject, Subject, scan, map, takeUntil } from 'rxjs';
import { RoomEgress } from 'livekit-server-sdk/dist/proto/livekit_room';
import { Packet } from '@dcl/protocol/out-js/decentraland/kernel/comms/rfc4/comms.gen'

export type { ChatMessage, ReceivedChatMessage };

/** @public */
export interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
  messageFormatter?: MessageFormatter;
}

/* export function setupChat(room: Room) {
 *   const onDestroyObservable = new Subject<void>();
 *   const messageSubject = new Subject<{
 *     payload: Uint8Array;
 *     topic: string | undefined;
 *     from: Participant | undefined;
 *   }>();
 * 
 * 
 *   return { messageObservable: messagesObservable, isSendingObservable: isSending$, send, destroy };
 * }
 * 
 *  */
export function cloneSingleChild(
  children: React.ReactNode | React.ReactNode[],
  props?: Record<string, any>,
  key?: any,
) {
  return React.Children.map(children, (child) => {
    // Checking isValidElement is the safe way and avoids a typescript
    // error too.
    if (React.isValidElement(child) && React.Children.only(children)) {
      return React.cloneElement(child, { ...props, key });
    }
    return child;
  });
}


/**
 * @internal
 */
/* export function useObservableState<T>(observable: Observable<T> | undefined, startWith: T) {
 *   const [state, setState] = React.useState<T>(startWith);
 *   React.useEffect(() => {
 *     // observable state doesn't run in SSR
 *     if (typeof window === 'undefined' || !observable) return;
 *     const subscription = observable.subscribe(setState);
 *     return () => subscription.unsubscribe();
 *   }, [observable]);
 *   return state;
 * }
 *  */
/** @public */
/* export function useChat() {
 *   const room = useRoomContext();
 *   const [setup, setSetup] = React.useState<ReturnType<typeof setupChat>>();
 *   const isSending = useObservableState(setup?.isSendingObservable, false);
 *   const chatMessages = useObservableState(setup?.messageObservable, []);
 * 
 *   React.useEffect(() => {
 *     const setupChatReturn = setupChat(room);
 *     setSetup(setupChatReturn);
 *     return setupChatReturn.destroy;
 *   }, [room]);
 * 
 *   return { send: setup?.send, chatMessages, isSending };
 * }
 *  */
/**
 * The Chat component adds a basis chat functionality to the LiveKit room. The messages are distributed to all participants
 * in the room. Only users who are in the room at the time of dispatch will receive the message.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <Chat />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function Chat({ messageFormatter, ...props }: ChatProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const ulRef = React.useRef<HTMLUListElement>(null);
    /* const { send, chatMessages, isSending } = useChat();
     */
    const [chatMessages, setChatMessages] = React.useState<ReceivedChatMessage[]>([])

  const room = useRoomContext();
  room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: Participant, _?: DataPacket_Kind) => {

      if (participant) {
          const packet = Packet.decode(payload)
          if (packet.message && packet.message.$case === 'chat') {
              const { timestamp, message } =  packet.message.chat
              const msg = {from: participant, timestamp, message }
              setChatMessages([ msg, ...chatMessages])
          }
      }
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
      /* if (inputRef.current && inputRef.current.value.trim() !== '') {
       *   if (send) {
       *     await send(inputRef.current.value);
       *     inputRef.current.value = '';
       *     inputRef.current.focus();
       *   }
       * } */
  }

    const isSending = false

  React.useEffect(() => {
    if (ulRef) {
      ulRef.current?.scrollTo({ top: ulRef.current.scrollHeight });
    }
  }, [ulRef, chatMessages]);

  return (
    <div {...props} className="lk-chat">
      <ul className="lk-list lk-chat-messages" ref={ulRef}>
        {props.children
          ? chatMessages.map((msg, idx) =>
              cloneSingleChild(props.children, {
                entry: msg,
                key: idx,
                messageFormatter,
              }),
            )
          : chatMessages.map((msg, idx, allMsg) => {
              const hideName = idx >= 1 && allMsg[idx - 1].from === msg.from;
              // If the time delta between two messages is bigger than 60s show timestamp.
              const hideTimestamp = idx >= 1 && msg.timestamp - allMsg[idx - 1].timestamp < 60_000;

              return (
                <ChatEntry
                  key={idx}
                  hideName={hideName}
                  hideTimestamp={hideName === false ? false : hideTimestamp} // If we show the name always show the timestamp as well.
                  entry={msg}
                  messageFormatter={messageFormatter}
                />
              );
            })}
      </ul>
      <form className="lk-chat-form" onSubmit={handleSubmit}>
        <input
          className="lk-form-control lk-chat-form-input"
          disabled={isSending}
          ref={inputRef}
          type="text"
          placeholder="Enter a message..."
        />
        <button type="submit" className="lk-button lk-chat-form-button" disabled={isSending}>
          Send
        </button>
      </form>
    </div>
  );
}
