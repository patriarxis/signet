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
          bgcolor="#e6e6e6"
          style="background-color: #e6e6e6; border-radius: 16px; padding: 16px"
        >
          <table
            role="presentation"
            cellspacing="0"
            cellpadding="0"
            border="0"
            width="100%"
            bgcolor="#08442b"
            style="
              border-collapse: collapse;
              width: 100%;
              background-color: #08442b;
              border-radius: 12px;
            "
          >
            <tbody>
              <tr>
                <td style="padding: 16px" valign="middle">
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
                        <td valign="middle" style="vertical-align: middle">
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
                                    style-key="corporate-pro"
                                    placeholder="Add name"
                                    emphasize="b"
                                    text-style="font-family: Arial, Helvetica, sans-serif; font-size: 18px; line-height: 1.3; color: #ffffff;"
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <EditableText
                                    field="description"
                                    style-key="corporate-pro"
                                    placeholder="Add title"
                                    text-style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: normal; line-height: 1.4; color: #b5c7c0;"
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
                                              link-style="display: inline-block; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #84a295;"
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
                                                background-color: #84a295;
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
                        <td
                          width="40"
                          align="right"
                          valign="middle"
                          style="
                            width: 40px;
                            text-align: right;
                            vertical-align: middle;
                            padding-left: 12px;
                          "
                        >
                          <EditableImage
                            image-key="corporate-pro"
                            :width="40"
                            :height="40"
                            display="inline-block"
                            :alt="website || 'Logo'"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

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
                  height="16"
                  style="height: 16px; font-size: 0; line-height: 0"
                >
                  &nbsp;
                </td>
              </tr>
              <tr>
                <td>
                  <EditableText
                    field="copyrights"
                    style-key="corporate-pro"
                    placeholder="Add copyright"
                    text-style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.4; color: #666666;"
                  />
                </td>
              </tr>
              <tr>
                <td style="padding-top: 12px">
                  <EditableText
                    field="companyTagline"
                    style-key="corporate-pro"
                    placeholder="Add tagline"
                    text-style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.4; color: #666666;"
                  />
                </td>
              </tr>
              <tr>
                <td style="padding-top: 12px">
                  <EditableText
                    field="disclaimer"
                    style-key="corporate-pro"
                    placeholder="Add disclaimer"
                    emphasize="i"
                    multiline
                    text-style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.4; color: #666666;"
                  />
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
  throw new Error("CorporatePro requires signature editor context");
}
const editor = editorCtx;

const socialLinks = editor.userData.socialLinks;
const website = computed(() => editor.userData.website);
</script>
