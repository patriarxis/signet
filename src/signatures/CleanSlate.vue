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
          bgcolor="#f2f2f2"
          style="background-color: #f2f2f2; border-radius: 4px; padding: 16px"
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
                    style-key="clean-slate"
                    placeholder="Add name"
                    emphasize="b"
                    text-style="font-family: Arial, Helvetica, sans-serif; font-size: 18px; line-height: 1.3; color: #333333;"
                  />
                </td>
              </tr>
              <tr>
                <td style="padding-top: 4px">
                  <EditableText
                    field="description"
                    style-key="clean-slate"
                    placeholder="Add title"
                    text-style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.4; color: #666666;"
                  />
                </td>
              </tr>
              <tr
                v-for="(_link, index) in bodyLinks"
                :key="`body-${index}`"
              >
                <td
                  :style="bodyLinkCellStyle(index, bodyLinks.length)"
                >
                  <EditableLink
                    list="bodyLinks"
                    :index="index"
                    placeholder="Add link"
                    display="block"
                    link-style="display: block; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333333;"
                  />
                </td>
              </tr>
              <!-- Empty body-links container was still padding-top/bottom 12px. -->
              <tr v-if="bodyLinks.length === 0">
                <td
                  height="24"
                  style="height: 24px; font-size: 0; line-height: 0"
                >
                  &nbsp;
                </td>
              </tr>
              <tr>
                <td
                  align="left"
                  style="
                    padding-top: 12px;
                    border-top: 1px solid #d1d1d1;
                    text-align: left;
                  "
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
                                background: #d1d1d1;
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
</template>

<script setup lang="ts">
import { inject } from "vue";
import EditableLink from "../components/EditableLink.vue";
import EditableText from "../components/EditableText.vue";
import { signatureEditorKey } from "../composables/signatureEditor";

const editor = inject(signatureEditorKey);
if (!editor) {
  throw new Error("CleanSlate requires signature editor context");
}

const bodyLinks = editor.userData.bodyLinks;
const socialLinks = editor.userData.socialLinks;

/** Match former container padding + per-link margin-bottom gaps. */
function bodyLinkCellStyle(index: number, total: number): string {
  const parts: string[] = [];
  if (index === 0) parts.push("padding-top: 12px");
  else parts.push("padding-top: 4px");
  // Last link previously had margin-bottom: 4px + container padding-bottom: 12px.
  if (index === total - 1) parts.push("padding-bottom: 16px");
  return parts.join("; ");
}
</script>
