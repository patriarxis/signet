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
        <td style="padding-bottom: 4px">
          <table
            role="presentation"
            cellspacing="0"
            cellpadding="0"
            border="0"
            width="100%"
            bgcolor="#0d0d0d"
            style="
              border-collapse: collapse;
              width: 100%;
              background-color: #0d0d0d;
              border: 1px solid #4d4d4d;
              border-radius: 4px;
            "
          >
            <tbody>
              <tr>
                <td style="padding: 16px">
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
                            style-key="dark-edge"
                            placeholder="Add name"
                            emphasize="b"
                            text-style="font-family: Arial, Helvetica, sans-serif; font-size: 18px; line-height: 1.3; color: #f2f2f2;"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 4px">
                          <EditableText
                            field="phone"
                            style-key="dark-edge"
                            placeholder="Add phone"
                            text-style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: normal; line-height: 1.4; color: #f2f2f2;"
                          />
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
      <tr>
        <td>
          <table
            role="presentation"
            cellspacing="0"
            cellpadding="0"
            border="0"
            width="100%"
            bgcolor="#0d0d0d"
            style="
              border-collapse: collapse;
              width: 100%;
              background-color: #0d0d0d;
              border: 1px solid #4d4d4d;
              border-radius: 4px;
            "
          >
            <tbody>
              <tr>
                <td style="padding: 16px 16px 0 16px">
                  <EditableImage
                    image-key="dark-edge"
                    :width="48"
                    :height="48"
                    :alt="website || 'Logo'"
                  />
                </td>
              </tr>
              <tr>
                <td style="padding: 16px">
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
                            field="companyName"
                            style-key="dark-edge"
                            placeholder="Add company"
                            emphasize="b"
                            text-style="font-family: Arial, Helvetica, sans-serif; font-size: 20px; line-height: 1.3; color: #f2f2f2;"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <EditableText
                            field="companyTagline"
                            style-key="dark-edge"
                            placeholder="Add tagline"
                            text-style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; color: #f2f2f2;"
                          />
                        </td>
                      </tr>
                      <tr
                        v-for="(_link, index) in bodyLinks"
                        :key="`body-${index}`"
                      >
                        <td
                          :style="
                            index === 0
                              ? 'padding-top: 16px'
                              : 'padding-top: 4px'
                          "
                        >
                          <EditableLink
                            list="bodyLinks"
                            :index="index"
                            placeholder="Add link"
                            display="block"
                            link-style="display: block; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f2f2f2;"
                          />
                        </td>
                      </tr>
                      <!--
                        Former last-link margin-bottom (4) + social margin-top (16)
                        when links exist; empty body-links wrapper padding-top (16)
                        + social margin-top (16) when none.
                      -->
                      <tr>
                        <td
                          :height="bodyLinks.length ? 20 : 32"
                          :style="
                            bodyLinks.length
                              ? 'height: 20px; font-size: 0; line-height: 0;'
                              : 'height: 32px; font-size: 0; line-height: 0;'
                          "
                        >
                          &nbsp;
                        </td>
                      </tr>
                      <tr>
                        <td
                          align="left"
                          style="
                            border-top: 1px solid #4d4d4d;
                            padding-top: 16px;
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
                                      link-style="display: inline-block; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #f2f2f2;"
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
                                        background: #4d4d4d;
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

const editor = inject(signatureEditorKey);
if (!editor) {
  throw new Error("DarkEdge requires signature editor context");
}

const bodyLinks = editor.userData.bodyLinks;
const socialLinks = editor.userData.socialLinks;
const website = computed(() => editor.userData.website);
</script>
