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
              border-radius: 16px;
              background-color: #e6e6e6;
              padding: 16px;
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
                      border-radius: 12px;
                      background-color: #08442b;
                      padding: 16px;
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
                                <td>
                                  <p
                                    style="
                                      font-family: Arial, sans-serif;
                                      font-size: 18px;
                                      font-weight: 700;
                                      margin: 0;
                                      color: #ffffff;
                                    "
                                  >
                                    {{ name }}
                                  </p>
                                  <p
                                    style="
                                      font-family: Arial, sans-serif;
                                      font-size: 15px;
                                      font-weight: 400;
                                      color: #b5c7c0;
                                      margin: 0;
                                    "
                                  >
                                    {{ description }}
                                  </p>
                                </td>
                              </tr>

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
                                        font-size: 13px;
                                        font-weight: 400;
                                        color: #84a295;
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
                                        background-color: #84a295;
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

                        <td style="width: 40px">
                          <a :href="websiteUrl">
                            <img
                              src="https://placehold.co/40x40"
                              :alt="website"
                              width="40"
                              height="40"
                              style="
                                display: block;
                                text-decoration: none;
                                float: right;
                              "
                            />
                          </a>
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
                        <td style="padding-top: 16px">
                          <p
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 13px;
                              font-weight: 400;
                              margin: 0;
                              color: #666666;
                            "
                          >
                            {{ copyrights }}
                          </p>
                          <p
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 13px;
                              font-weight: 400;
                              margin: 0;
                              margin-top: 12px;
                              color: #666666;
                            "
                          >
                            {{ companyTagline }}
                          </p>
                          <p
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 13px;
                              font-weight: 400;
                              margin: 0;
                              margin-top: 12px;
                              color: #666666;
                            "
                          >
                            <i>{{ disclaimer }}</i>
                          </p>
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
  name: "CorporatePro",
  props: {
    name: { type: String, required: true },
    description: { type: String, required: true },
    website: { type: String, required: true },
    websiteUrl: { type: String, required: true },
    socialLinks: { type: Array, default: () => [] },
    copyrights: { type: String, required: true },
    companyTagline: { type: String, default: "" },
    disclaimer: { type: String, required: true },
  },
};
</script>
