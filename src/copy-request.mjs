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
