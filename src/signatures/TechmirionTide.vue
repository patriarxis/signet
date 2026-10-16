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
      font-family: Inter, 'Helvetica Neue', Arial, sans-serif;
    "
  >
    <tbody>
      <tr>
        <td
          bgcolor="#0a0a0a"
          style="
            background-color: #0a0a0a;
            border-radius: 8px 8px 0 0;
            padding: 20px;
          "
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
                <td valign="top" style="vertical-align: top">
                  <EditableText
                    field="companyName"
                    style-key="techmirion-tide"
                    placeholder="Add company"
                    emphasize="b"
                    text-style="font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace; font-size: 11px; line-height: 1.4; letter-spacing: 2px; text-transform: uppercase; color: #ff5200;"
                  />
                </td>
                <td
                  width="44"
                  rowspan="3"
                  align="right"
                  valign="top"
                  style="
                    width: 44px;
                    text-align: right;
                    vertical-align: top;
                    padding-left: 16px;
                  "
                >
                  <EditableImage
                    image-key="techmirion-tide"
                    :width="44"
                    :height="44"
                    display="inline-block"
                    :alt="website || 'Logo'"
                  />
                </td>
              </tr>
              <tr>
                <td style="padding-top: 10px">
                  <EditableText
                    field="name"
                    style-key="techmirion-tide"
                    placeholder="Add name"
                    emphasize="b"
                    text-style="font-family: Inter, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; line-height: 1.25; color: #f2f0eb;"
                  />
                </td>
              </tr>
              <tr>
                <td style="padding-top: 2px">
                  <EditableText
                    field="description"
                    style-key="techmirion-tide"
                    placeholder="Add title"
                    text-style="font-family: Inter, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: normal; line-height: 1.4; color: #bcd2e6;"
                  />
                </td>
              </tr>
              <tr>
                <td
                  colspan="2"
                  height="16"
                  style="
                    height: 16px;
                    border-bottom: 1px solid #262626;
                    font-size: 0;
                    line-height: 0;
                  "
                >
                  &nbsp;
                </td>
              </tr>
              <tr>
                <td
                  colspan="2"
                  align="left"
                  style="padding-top: 14px; text-align: left"
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
                              link-style="display: inline-block; text-decoration: none; font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace; font-size: 12px; color: #f2f0eb;"
                            />
                          </td>
                          <td
                            v-if="index < socialLinks.length - 1"
                            style="
                              vertical-align: middle;
                              padding: 0 8px;
                              font-size: 0;
                              line-height: 0;
                            "
                          >
                            <span
                              data-signet-sep="true"
                              style="
                                display: block;
                                width: 4px;
                                height: 4px;
                                background-color: #ff5200;
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
      <tr>
        <td
          height="4"
          bgcolor="#ff5200"
          style="
            height: 4px;
            background-color: #ff5200;
            border-radius: 0 0 8px 8px;
            font-size: 0;
            line-height: 0;
          "
        >
          &nbsp;
        </td>
      </tr>
      <tr>
        <td style="padding-top: 10px">
          <TideArt />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
/**
 * Techmirion brand v2.0: INK #0A0A0A card, PAPER #F2F0EB text,
 * LAB #BCD2E6 secondary, SIGNAL #FF5200 kicker + base strip, pixel-ocean
 * sunset artwork under the card.
 */
import { computed, inject } from "vue";
import EditableImage from "../components/EditableImage.vue";
import EditableLink from "../components/EditableLink.vue";
import EditableText from "../components/EditableText.vue";
import { signatureEditorKey } from "../composables/signatureEditor";
import TideArt from "./art/TideArt.vue";

const editorCtx = inject(signatureEditorKey);
if (!editorCtx) {
  throw new Error("TechmirionTide requires signature editor context");
}
const editor = editorCtx;

const socialLinks = editor.userData.socialLinks;
const website = computed(() => editor.userData.website);
</script>
