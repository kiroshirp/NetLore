export async function copyRequestMessage(message, { clipboard, selectMessage }) {
  try {
    if (!clipboard?.writeText) throw new Error('Clipboard unavailable');
    await clipboard.writeText(message);
    return 'copied';
  } catch {
    selectMessage();
    return 'manual';
  }
}
export function listingRequestMessage(messages,option='free') {
  if(option==='free')return messages.freeRequestMessage;
  if(option==='paid')return messages.requestMessage;
  throw new Error('Unknown listing option');
}
