import { ref } from "vue";

export function useClipboardHtml() {
  const status = ref<"idle" | "success" | "error">("idle");
  const message = ref("");
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flash = (next: "success" | "error", text: string) => {
    status.value = next;
    message.value = text;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      status.value = "idle";
      message.value = "";
    }, 2500);
  };

  const copyHtml = async (html: string) => {
    try {
      if (navigator.clipboard && "ClipboardItem" in window) {
        const htmlBlob = new Blob([html], { type: "text/html" });
        const textBlob = new Blob([html], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob,
          }),
        ]);
      } else {
        const temp = document.createElement("div");
        temp.style.position = "fixed";
        temp.style.left = "-9999px";
        temp.innerHTML = html;
        document.body.appendChild(temp);

        const range = document.createRange();
        range.selectNode(temp);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        const ok = document.execCommand("copy");
        selection?.removeAllRanges();
        document.body.removeChild(temp);

        if (!ok) throw new Error("Copy command failed");
      }

      flash("success", "Signature copied");
      return true;
    } catch {
      flash("error", "Could not copy signature");
      return false;
    }
  };

  return {
    status,
    message,
    copyHtml,
  };
}
