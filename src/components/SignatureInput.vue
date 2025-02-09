<template>
  <aside class="aside">
    <header class="header">
      <h1 class="title">Signet - Email Signatures</h1>
      <p class="description">
        Signet lets you browse and customize email signatures effortlessly.
        Edit, copy, and use them as you please.
      </p>
    </header>

    <div class="scroll-container" ref="container">
      <div class="scroll-shadow-top"></div>
      <div class="scroll-shadow-bottom"></div>
      <div class="scroll-content" @scroll="handleScroll">
        <div class="inputs">
          <div class="input-group">
            <label for="name">Name:</label>
            <input
              type="text"
              id="name"
              :value="userData.name"
              @input="handleNameChange"
              placeholder="Name"
            />
          </div>

          <div class="input-group">
            <label for="description">Description:</label>
            <input
              type="text"
              id="description"
              :value="userData.description"
              @input="handleDescriptionChange"
              placeholder="Description"
            />
          </div>

          <div class="input-group">
            <label for="companyName">Company Name:</label>
            <input
              type="text"
              id="companyName"
              :value="userData.companyName"
              @input="handleCompanyNameChange"
              placeholder="Company Name"
            />
          </div>

          <div class="input-group">
            <label for="companyTagline">Company Tagline:</label>
            <input
              type="text"
              id="companyTagline"
              :value="userData.companyTagline"
              @input="handleCompanyTaglineChange"
              placeholder="Company Tagline"
            />
          </div>

          <div class="input-group">
            <label for="phone">Phone:</label>
            <input
              type="tel"
              id="phone"
              :value="userData.phone"
              @input="handlePhoneChange"
              placeholder="Phone Number"
            />
          </div>

          <div class="input-group">
            <label for="email">Email:</label>
            <input
              type="email"
              id="email"
              :value="userData.email"
              @input="handleEmailChange"
              placeholder="Email Address"
            />
          </div>

          <div class="input-group">
            <label for="website">Website Name:</label>
            <div class="link-inputs">
              <input
                type="text"
                id="website"
                :value="userData.website"
                @input="handleWebsiteChange"
                placeholder="Website Name"
              />
              <input
                class="link-href"
                type="url"
                id="websiteUrl"
                :value="userData.websiteUrl"
                @input="handleWebsiteUrlChange"
                placeholder="URL"
              />
            </div>
          </div>

          <div class="input-group">
            <label>Body Links:</label>
            <div class="links">
              <div
                class="link"
                v-for="(link, index) in userData.bodyLinks"
                :key="index"
              >
                <div class="link-inputs">
                  <input
                    class="link-name"
                    type="text"
                    placeholder="Link Text"
                    :value="link.text"
                    @input="handleBodyLinkTextChange(index, $event)"
                  />

                  <input
                    class="link-href"
                    type="url"
                    placeholder="URL"
                    :value="link.url"
                    @input="handleBodyLinkUrlChange(index, $event)"
                  />
                </div>

                <button class="remove-link" @click="removeBodyLink(index)">
                  Remove
                </button>
              </div>

              <button class="add-link" @click="addBodyLink">
                + Add Body Link
              </button>
            </div>
          </div>

          <div class="input-group">
            <label>Social Links:</label>
            <div class="links">
              <div
                class="link"
                v-for="(link, index) in userData.socialLinks"
                :key="index"
              >
                <div class="link-inputs">
                  <input
                    class="link-name"
                    type="text"
                    placeholder="Link Text"
                    :value="link.text"
                    @input="handleSocialLinkTextChange(index, $event)"
                  />

                  <input
                    class="link-href"
                    type="url"
                    placeholder="URL"
                    :value="link.url"
                    @input="handleSocialLinkUrlChange(index, $event)"
                  />
                </div>

                <button class="remove-link" @click="removeSocialLink(index)">
                  Remove
                </button>
              </div>

              <button class="add-link" @click="addSocialLink">
                + Add Social Link
              </button>
            </div>
          </div>

          <div class="input-group">
            <label for="copyrights">Copyrights:</label>
            <input
              type="text"
              id="copyrights"
              :value="userData.copyrights"
              @input="handleCopyrightsChange"
              placeholder="Copyrights Text"
            />
          </div>

          <div class="input-group">
            <label for="disclaimer">Disclaimer:</label>
            <textarea
              id="disclaimer"
              :value="userData.disclaimer"
              @input="handleDisclaimerChange"
              placeholder="Disclaimer Text"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
export default {
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
  mounted() {
    this.updateScrollShadows();
    const inputsElement = this.$el.querySelector(".scroll-content");
    if (inputsElement) {
      inputsElement.addEventListener("scroll", this.handleScroll);
    }
  },
  unmounted() {
    const inputsElement = this.$el.querySelector(".scroll-content");
    if (inputsElement) {
      inputsElement.removeEventListener("scroll", this.handleScroll);
    }
  },
  methods: {
    handleNameChange(event) {
      this.$emit("update:userData", {
        ...this.userData,
        name: event.target.value,
      });
    },
    handleDescriptionChange(event) {
      this.$emit("update:userData", {
        ...this.userData,
        description: event.target.value,
      });
    },
    handleCompanyNameChange(event) {
      this.$emit("update:userData", {
        ...this.userData,
        companyName: event.target.value,
      });
    },
    handleCompanyTaglineChange(event) {
      this.$emit("update:userData", {
        ...this.userData,
        companyTagline: event.target.value,
      });
    },
    handlePhoneChange(event) {
      this.$emit("update:userData", {
        ...this.userData,
        phone: event.target.value,
      });
    },
    handleEmailChange(event) {
      this.$emit("update:userData", {
        ...this.userData,
        email: event.target.value,
      });
    },
    handleWebsiteChange(event) {
      this.$emit("update:userData", {
        ...this.userData,
        website: event.target.value,
      });
    },
    handleWebsiteUrlChange(event) {
      this.$emit("update:userData", {
        ...this.userData,
        websiteUrl: event.target.value,
      });
    },
    handleBodyLinkTextChange(index, event) {
      const newLinks = [...this.userData.bodyLinks];
      newLinks[index] = {
        ...newLinks[index],
        text: event.target.value,
      };
      this.$emit("update:userData", {
        ...this.userData,
        bodyLinks: newLinks,
      });
    },
    handleBodyLinkUrlChange(index, event) {
      const newLinks = [...this.userData.bodyLinks];
      newLinks[index] = {
        ...newLinks[index],
        url: event.target.value,
      };
      this.$emit("update:userData", {
        ...this.userData,
        bodyLinks: newLinks,
      });
    },
    addBodyLink() {
      this.$emit("update:userData", {
        ...this.userData,
        bodyLinks: [...this.userData.bodyLinks, { text: "", url: "" }],
      });
    },
    removeBodyLink(index) {
      const newLinks = [...this.userData.bodyLinks];
      newLinks.splice(index, 1);
      this.$emit("update:userData", {
        ...this.userData,
        bodyLinks: newLinks,
      });
    },
    handleSocialLinkTextChange(index, event) {
      const newLinks = [...this.userData.socialLinks];
      newLinks[index] = {
        ...newLinks[index],
        text: event.target.value,
      };
      this.$emit("update:userData", {
        ...this.userData,
        socialLinks: newLinks,
      });
    },
    handleSocialLinkUrlChange(index, event) {
      const newLinks = [...this.userData.socialLinks];
      newLinks[index] = {
        ...newLinks[index],
        url: event.target.value,
      };
      this.$emit("update:userData", {
        ...this.userData,
        socialLinks: newLinks,
      });
    },
    addSocialLink() {
      this.$emit("update:userData", {
        ...this.userData,
        socialLinks: [...this.userData.socialLinks, { text: "", url: "" }],
      });
    },
    removeSocialLink(index) {
      const newLinks = [...this.userData.socialLinks];
      newLinks.splice(index, 1);
      this.$emit("update:userData", {
        ...this.userData,
        socialLinks: newLinks,
      });
    },
    handleCopyrightsChange(event) {
      this.$emit("update:userData", {
        ...this.userData,
        copyrights: event.target.value,
      });
    },
    handleDisclaimerChange(event) {
      this.$emit("update:userData", {
        ...this.userData,
        disclaimer: event.target.value,
      });
    },
    handleScroll(event) {
      const scrollElement =
        event?.target || this.$el.querySelector(".scroll-content");
      if (!scrollElement) return;

      const container = this.$refs.container;
      if (!container) return;

      const scrollTop = scrollElement.scrollTop;
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;

      container.classList.remove("can-scroll-up", "can-scroll-down");

      if (scrollTop > 0) {
        container.classList.add("can-scroll-up");
      }

      if (scrollTop + clientHeight < scrollHeight) {
        container.classList.add("can-scroll-down");
      }
    },
    updateScrollShadows() {
      this.handleScroll();
    },
  },
};
</script>

<style scoped>
.aside {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  flex-shrink: 0;
  border-right: 1px solid var(--neutral-3);
  background-color: var(--neutral-1);
}

.header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
  background-color: var(--neutral-1);
  border-bottom: 1px solid var(--neutral-3);
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
}

.description {
  font-size: 1rem;
  color: var(--neutral-6);
}

.scroll-container {
  position: relative;
  flex-grow: 1;
  width: 100%;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
}

.scroll-content {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.scroll-shadow-top,
.scroll-shadow-bottom {
  position: absolute;
  left: 0;
  right: 0;
  height: 2rem;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  z-index: 20;
}

.scroll-shadow-top {
  top: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0) 100%
  );
}

.scroll-shadow-bottom {
  bottom: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0) 100%
  );
}

.can-scroll-up .scroll-shadow-top {
  opacity: 1;
}

.can-scroll-down .scroll-shadow-bottom {
  opacity: 1;
}

.inputs {
  position: relative;
  width: 100%;
  height: 100%;
}

.input-group {
  display: flex;
  flex-direction: row;
}

.input-group:not(:last-child) {
  border-bottom: 1px solid var(--neutral-3);
}

label {
  flex-basis: 35%;
  flex-shrink: 0;
  padding: 0.5rem;
  font-weight: 500;
  font-size: 0.825rem;
  border-right: 1px solid var(--neutral-3);
  color: var(--neutral-5);
}

input,
textarea {
  position: relative;
  flex-grow: 1;
  padding: 0.5rem;
  border: 1px solid transparent;
  font-size: 0.825rem;
  background-color: var(--neutral-1);
  transition-property: border-color, box-shadow;
  transition-duration: 0.2s;
  transition-duration: ease-in-out;
}

textarea {
  width: 100%;
  min-height: 300px;
  resize: none;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--red-1);
  box-shadow: 0 0 0 0.2rem rgba(255, 0, 0, 0.2);
  z-index: 1;
}

input:active,
textarea:active {
  box-shadow: none;
}

.links {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.link {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.link:not(:last-child) {
  border-bottom: 1px solid var(--neutral-3);
}

.link-inputs {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.link-href {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background-color: var(--neutral-2);
  color: var(--neutral-7);
  padding: 0.25rem;
  margin: 0 0.5rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
}

.remove-link {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  color: var(--white);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.7rem;
  color: var(--neutral-5);
  transition: color 0.2s ease-in-out;
}

.remove-link:hover {
  color: var(--red-1);
}

.remove-link:focus {
  outline: none;
}

.add-link {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin: 0.5rem;
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.7rem;
  color: var(--neutral-7);
  background-color: var(--neutral-2);
  transition: all 0.2s ease-in-out;
}

.add-link:hover {
  color: var(--neutral-0);
  background-color: var(--red-1);
  box-shadow: 0 0 0 0.2rem rgba(255, 0, 0, 0.2);
}

.add-link:active {
  box-shadow: none;
}

.add-link:focus {
  outline: none;
}

@media screen and (max-width: 1024px) {
  .aside {
    max-width: 600px;
    border-left: 1px solid var(--neutral-3);
  }

  .scroll-container {
    height: 200px;
  }

  .scroll-container:focus-within {
    height: 600px;
  }
}
</style>
