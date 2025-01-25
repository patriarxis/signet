<template>
  <table
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
      display: table;
      border-collapse: separate;
      border-spacing: 0;
      vertical-align: top;
      width: 100%;
      max-width: 600px;
      min-width: 320px;
      font-family: Arial, sans-serif;
    "
  >
    <tbody>
      <tr>
        <td>
          <table
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              border-collapse: separate;
              border-spacing: 0;
              width: 100%;
              padding: 16px;
              border-radius: 12px;
              background: #e8e8e8;
            "
          >
            <tbody>
              <tr>
                <td>
                  <table
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                      border-collapse: separate;
                      border-spacing: 0;
                      width: 100%;
                    "
                  >
                    <tbody>
                      <tr>
                        <td style="width: 56px; padding-right: 16px">
                          <a
                            :href="websiteUrl"
                            target="_blank"
                            style="display: block; text-decoration: none"
                          >
                            <img
                              src="https://placeholder.com/56x56"
                              width="56"
                              height="56"
                              :alt="website"
                              style="display: block"
                            />
                          </a>
                        </td>
                        <td>
                          <table
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            style="
                              border-collapse: separate;
                              border-spacing: 0;
                              width: 100%;
                            "
                          >
                            <tbody>
                              <tr>
                                <td>
                                  <p
                                    style="
                                      font-family: Arial, sans-serif;
                                      font-size: 16px;
                                      font-weight: 700;
                                      margin: 0;
                                      color: #000000;
                                    "
                                  >
                                    {{ name }}
                                  </p>
                                  <p
                                    style="
                                      font-family: Arial, sans-serif;
                                      font-size: 14px;
                                      font-weight: 400;
                                      margin: 0;
                                      color: #4d4d4d;
                                    "
                                  >
                                    {{ description }}
                                  </p>
                                </td>
                                <td
                                  style="text-align: right; vertical-align: top"
                                >
                                  <table
                                    cellspacing="0"
                                    cellpadding="0"
                                    border="0"
                                    style="
                                      border-collapse: separate;
                                      border-spacing: 0;
                                      float: right;
                                    "
                                  >
                                    <tbody style="text-align: right">
                                      <tr>
                                        <td
                                          style="width: 20px; padding-left: 4px"
                                        >
                                          <a
                                            href="#"
                                            target="_blank"
                                            style="
                                              display: inline-block;
                                              text-decoration: none;
                                            "
                                          >
                                            <img
                                              width="20"
                                              height="20"
                                              style="display: block"
                                              src="https://placeholder.com/20x20"
                                              alt="social"
                                            />
                                          </a>
                                        </td>
                                        <td
                                          style="width: 20px; padding-left: 4px"
                                        >
                                          <a
                                            href="#"
                                            target="_blank"
                                            style="
                                              display: inline-block;
                                              text-decoration: none;
                                            "
                                          >
                                            <img
                                              width="20"
                                              height="20"
                                              style="display: block"
                                              src="https://placeholder.com/20x20"
                                              alt="social"
                                            />
                                          </a>
                                        </td>
                                        <td
                                          style="width: 20px; padding-left: 4px"
                                        >
                                          <a
                                            href="#"
                                            target="_blank"
                                            style="
                                              display: inline-block;
                                              text-decoration: none;
                                            "
                                          >
                                            <img
                                              width="20"
                                              height="20"
                                              style="display: block"
                                              src="https://placeholder.com/20x20"
                                              alt="social"
                                            />
                                          </a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <table
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            style="
                              border-collapse: separate;
                              border-spacing: 0;
                              width: 100%;
                            "
                          >
                            <tbody>
                              <tr>
                                <td>
                                  <template
                                    v-for="(socialLink, index) in socialLinks"
                                    :key="socialLink.url"
                                  >
                                    <a
                                      :href="socialLink.url"
                                      target="_blank"
                                      style="
                                        display: inline-block;
                                        text-decoration: none;
                                        font-family: Arial, sans-serif;
                                        font-size: 12px;
                                        font-weight: 400;
                                        color: #666666;
                                      "
                                    >
                                      {{ socialLink.text }}
                                    </a>
                                    <span
                                      v-if="index < socialLinks.length - 1"
                                      style="
                                        display: inline-block;
                                        vertical-align: middle;
                                        width: 3px;
                                        height: 3px;
                                        background-color: #666666;
                                        border-radius: 50%;
                                        margin: 0 6px;
                                      "
                                    ></span>
                                  </template>
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
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  name: "ProfilePlus",
  props: {
    name: { type: String, required: true },
    description: { type: String, required: true },
    website: { type: String, required: true },
    websiteUrl: { type: String, required: true },
    socialLinks: { type: Array, default: () => [] },
  },
};
</script>
