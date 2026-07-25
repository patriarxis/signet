<template>
  <table
    role="presentation"
    cellspacing="0"
    cellpadding="0"
    border="0"
    width="100%"
    style="
      border-collapse: collapse;
      width: 100%;
      max-width: 600px;
      font-family: Arial, Helvetica, sans-serif;
    "
  >
    <tbody>
      <tr>
        <td
          bgcolor="#e8e8e8"
          style="background-color: #e8e8e8; border-radius: 12px; padding: 16px"
        >
          <table
            role="presentation"
            cellspacing="0"
            cellpadding="0"
            border="0"
            width="100%"
            style="border-collapse: collapse; width: 100%"
          >
            <tbody>
              <tr>
                <td
                  width="56"
                  valign="top"
                  style="width: 56px; vertical-align: top"
                >
                  <EditableImage
                    image-key="profile-plus"
                    :width="56"
                    :height="56"
                    :alt="website || 'Logo'"
                  />
                </td>
                <td
                  valign="middle"
                  style="padding-left: 16px; vertical-align: middle"
                >
                  <table
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="border-collapse: collapse; width: 100%"
                  >
                    <tbody>
                      <tr>
                        <td>
                          <EditableText
                            field="name"
                            style-key="profile-plus"
                            placeholder="Add name"
                            emphasize="b"
                            text-style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.3; color: #000000;"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <EditableText
                            field="description"
                            style-key="profile-plus"
                            placeholder="Add title"
                            text-style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: normal; line-height: 1.4; color: #4d4d4d;"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td
                          align="left"
                          style="padding-top: 4px; text-align: left"
                        >
                          <table
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            align="left"
                            style="border-collapse: collapse; text-align: left"
                          >
                            <tbody>
                              <tr>
                                <template
                                  v-for="(_link, index) in socialLinks"
                                  :key="`social-${index}`"
                                >
                                  <td style="vertical-align: middle">
                                    <EditableLink
                                      list="socialLinks"
                                      :index="index"
                                      placeholder="Add social link"
                                      display="inline-block"
                                      link-style="display: inline-block; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #666666;"
                                    />
                                  </td>
                                  <td
                                    v-if="index < socialLinks.length - 1"
                                    style="
                                      vertical-align: middle;
                                      padding: 0 6px;
                                      font-size: 0;
                                      line-height: 0;
                                    "
                                  >
                                    <span
                                      data-signet-sep="true"
                                      style="
                                        display: block;
                                        width: 3px;
                                        height: 3px;
                                        background-color: #666666;
                                        border-radius: 50%;
                                      "
                                    />
                                  </td>
                                </template>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import EditableImage from "../components/EditableImage.vue";
import EditableLink from "../components/EditableLink.vue";
import EditableText from "../components/EditableText.vue";
import { signatureEditorKey } from "../composables/signatureEditor";

const editorCtx = inject(signatureEditorKey);
if (!editorCtx) {
  throw new Error("ProfilePlus requires signature editor context");
}
const editor = editorCtx;

const socialLinks = editor.userData.socialLinks;
const website = computed(() => editor.userData.website);
</script>
