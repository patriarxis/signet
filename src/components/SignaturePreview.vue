<template>
  <div class="signatures-container">
    <div class="signatures">
      <div
        v-for="(componentName, index) in signatures"
        :key="index"
        class="signature-item window"
      >
        <div class="window-top">
          <h3 class="window-title">{{ index }}</h3>

          <button @click="copySignature(index)" class="copy-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="512"
              height="512"
              fill="currentColor"
              class="bi bi-clipboard"
              viewBox="0 0 512 512"
            >
              <path
                d="M277.333 426.667C305.613 426.633 332.724 415.384 352.721 395.387C372.717 375.391 383.966 348.279 384 320V133.184C384.033 121.97 381.84 110.862 377.548 100.502C373.256 90.1419 366.951 80.7369 358.997 72.832L311.168 25.0027C303.263 17.049 293.858 10.7435 283.498 6.45163C273.138 2.15974 262.03 -0.0331758 250.816 4.76697e-06H149.333C121.054 0.0338791 93.9426 11.2828 73.946 31.2794C53.9495 51.2759 42.7005 78.3873 42.6667 106.667V320C42.7005 348.279 53.9495 375.391 73.946 395.387C93.9426 415.384 121.054 426.633 149.333 426.667H277.333ZM85.3333 320V106.667C85.3333 89.6928 92.0762 73.4142 104.078 61.4118C116.081 49.4095 132.359 42.6667 149.333 42.6667C149.333 42.6667 254.272 42.9653 256 43.1787V85.3333C256 96.6492 260.495 107.502 268.497 115.503C276.498 123.505 287.351 128 298.667 128H340.821C341.035 129.728 341.333 320 341.333 320C341.333 336.974 334.591 353.253 322.588 365.255C310.586 377.257 294.307 384 277.333 384H149.333C132.359 384 116.081 377.257 104.078 365.255C92.0762 353.253 85.3333 336.974 85.3333 320ZM469.333 170.667V405.333C469.299 433.613 458.051 460.724 438.054 480.721C418.057 500.717 390.946 511.966 362.667 512H170.667C165.009 512 159.583 509.752 155.582 505.752C151.581 501.751 149.333 496.325 149.333 490.667C149.333 485.009 151.581 479.582 155.582 475.582C159.583 471.581 165.009 469.333 170.667 469.333H362.667C379.641 469.333 395.919 462.591 407.922 450.588C419.924 438.586 426.667 422.307 426.667 405.333V170.667C426.667 165.009 428.914 159.583 432.915 155.582C436.916 151.581 442.342 149.333 448 149.333C453.658 149.333 459.084 151.581 463.085 155.582C467.086 159.583 469.333 165.009 469.333 170.667Z"
              />
            </svg>
          </button>
        </div>

        <div class="window-body" contenteditable="true">
          <component
            :is="componentName"
            v-bind="processedUserData"
            ref="signatureComponents"
            class="signature"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { markRaw } from "vue";
import { DarkEdge, CleanSlate, ProfilePlus, CorporatePro } from "../signatures";

export default {
  name: "SignaturePreview",

  props: {
    userData: {
      type: Object,
      required: true,
      default: () => ({
        name: "",
        description: "",
        companyName: "",
        companyTagline: "",
        phone: "",
        email: "",
        website: "",
        websiteUrl: "",
        bodyLinks: [],
        socialLinks: [],
        copyrights: "",
        disclaimer: "",
      }),
    },
  },

  computed: {
    processedUserData() {
      return {
        ...this.userData,
        bodyLinks: this.userData.bodyLinks.map((link) => ({
          text: String(link.text || ""),
          url: String(link.url || ""),
        })),
        socialLinks: this.userData.socialLinks.map((link) => ({
          text: String(link.text || ""),
          url: String(link.url || ""),
        })),
      };
    },
  },

  data() {
    return {
      signatures: {
        "dark-edge": markRaw(DarkEdge),
        "clean-slate": markRaw(CleanSlate),
        "profile-plus": markRaw(ProfilePlus),
        "corporate-pro": markRaw(CorporatePro),
      },
      copyStatus: "",
      copyMessage: "",
    };
  },

  methods: {
    async copySignature(signatureKey) {
      try {
        const components = this.$refs.signatureComponents;
        if (!components) {
          throw new Error("No signature components found");
        }

        const componentIndex = Object.keys(this.signatures).indexOf(
          signatureKey
        );
        const targetComponent = Array.isArray(components)
          ? components[componentIndex]
          : components;

        if (!targetComponent || !targetComponent.$el) {
          throw new Error("Signature component not found");
        }

        const signatureHtml = targetComponent.$el.outerHTML;

        if (navigator.clipboard && navigator.clipboard.write) {
          const htmlBlob = new Blob([signatureHtml], { type: "text/html" });
          await navigator.clipboard.write([
            new ClipboardItem({
              "text/html": htmlBlob,
            }),
          ]);
        } else {
          const tempDiv = document.createElement("div");
          tempDiv.style.position = "fixed";
          tempDiv.style.left = "-9999px";
          tempDiv.innerHTML = signatureHtml;
          document.body.appendChild(tempDiv);

          const range = document.createRange();
          range.selectNode(tempDiv);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);

          const success = document.execCommand("copy");

          selection.removeAllRanges();
          document.body.removeChild(tempDiv);

          if (!success) {
            throw new Error("Copy command failed");
          }
        }

        this.copyStatus = "success";
        this.copyMessage = "Signature copied to clipboard!";
        setTimeout(() => {
          this.copyMessage = "";
          this.copyStatus = "";
        }, 3000);
      } catch (error) {
        console.error("Failed to copy signature:", error);
        this.copyStatus = "error";
        this.copyMessage = "Failed to copy signature. Please try again.";
        setTimeout(() => {
          this.copyMessage = "";
          this.copyStatus = "";
        }, 3000);
      }
    },
  },
};
</script>

<style>
.signatures-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;
  overflow-y: auto;
}

.signatures {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.window {
  background-color: var(--neutral-0);
  border: 1px solid var(--neutral-2);
  border-radius: 0.5rem;
  overflow: hidden;
}

.window-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid var(--neutral-2);
}

.window-title {
  font-size: 1rem;
  font-weight: 500;
}

.window-body {
  padding: 2rem;
  background-color: white;
}

.copy-button {
  display: flex;
  align-items: center;
  background-color: var(--neutral-1);
  border: 1px solid var(--neutral-2);
  cursor: pointer;
  border-radius: 0.2rem;
  padding: 0.25rem;
  margin: 0;
  transition: all 0.2s ease-in-out;
}

.copy-button svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: var(--neutral-8);
  transition: all 0.2s ease-in-out;
}

.copy-button:hover {
  outline: none;
  border-color: var(--red-1);
  box-shadow: 0 0 0 0.125rem rgba(255, 0, 0, 0.2);
}

.copy-button:active {
  box-shadow: none;
}

.copy-button:hover svg {
  fill: var(--red-1);
}

@media screen and (max-width: 1024px) {
  .signatures-container {
    height: max-content;
    overflow-y: hidden;
    flex-shrink: 0;
    padding: 1rem;
    max-width: 600px;
    border: 1px solid var(--neutral-3);
    border-top: none;
  }

  .signatures {
    gap: 1rem;
  }
}
</style>
