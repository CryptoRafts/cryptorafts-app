import { onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Query } from 'firebase/firestore';

export function onSnapshotSafe(
  query: Query,
  onNext: (snapshot: any) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query,
    onNext,
    (error) => {
      if (onError) {
        // Custom error handler provided - use it
        onError(error);
      } else {
        // No custom handler - log as error
        console.error('Firestore error:', error);
      }
    }
  );
}
