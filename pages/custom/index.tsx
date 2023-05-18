import { formatChatMessageLinks, LiveKitRoom} from '@livekit/components-react';
import { LogLevel } from 'livekit-client';
import { useRouter } from 'next/router';
import { DebugMode } from '../../lib/Debug';
import { VideoConference } from '../VideoConferecen';

export default function CustomRoomConnection() {
  const router = useRouter();
  const { liveKitUrl, token } = router.query;
  if (typeof liveKitUrl !== 'string') {
    return <h2>Missing LiveKit URL</h2>;
  }
  if (typeof token !== 'string') {
    return <h2>Missing LiveKit token</h2>;
  }

    function formatter(message: string) {
        console.log(message)
        return formatChatMessageLinks(message)
    }
  return (
    <main data-lk-theme="default">
      {liveKitUrl && (
        <LiveKitRoom token={token} serverUrl={liveKitUrl} audio={true} video={true}>
          <VideoConference   chatMessageFormatter={formatter} />
          <DebugMode logLevel={LogLevel.info} />
        </LiveKitRoom>
      )}
    </main>
  );
}
