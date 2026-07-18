type DismissHandler = () => void;

const dismissStack: Array<{ token: symbol; dismiss: DismissHandler }> = [];

export function registerNativeDismissHandler(
  dismiss: DismissHandler,
): () => void {
  const token = Symbol("native-dismiss-handler");
  dismissStack.push({ token, dismiss });
  return () => {
    const index = dismissStack.findIndex((item) => item.token === token);
    if (index >= 0) dismissStack.splice(index, 1);
  };
}

export function dismissTopNativeOverlay(): boolean {
  const item = dismissStack.at(-1);
  if (!item) return false;
  item.dismiss();
  return true;
}
