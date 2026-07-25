import { onMounted, onUnmounted, ref, type Ref } from "vue";

export function useScrollShadows(scrollEl: Ref<HTMLElement | null>) {
  const canScrollUp = ref(false);
  const canScrollDown = ref(false);

  const update = () => {
    const el = scrollEl.value;
    if (!el) {
      canScrollUp.value = false;
      canScrollDown.value = false;
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = el;
    canScrollUp.value = scrollTop > 0;
    canScrollDown.value = scrollTop + clientHeight < scrollHeight - 1;
  };

  onMounted(() => {
    update();
    scrollEl.value?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  });

  onUnmounted(() => {
    scrollEl.value?.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
  });

  return {
    canScrollUp,
    canScrollDown,
    update,
  };
}
