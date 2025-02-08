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
              border: 1px solid #4d4d4d;
              border-radius: 4px;
              background-color: #0d0d0d;
              padding: 16px;
              margin-bottom: 4px;
            "
          >
            <tbody>
              <tr>
                <td>
                  <p
                    style="
                      font-family: Arial, sans-serif;
                      font-size: 18px;
                      font-weight: bold;
                      margin: 0;
                      color: #f2f2f2;
                    "
                  >
                    {{ name }}
                  </p>
                  <a
                    :href="'tel:' + phone"
                    style="
                      display: block;
                      text-decoration: none;
                      font-family: Arial, sans-serif;
                      font-size: 14px;
                      font-weight: 400;
                      margin-top: 4px;
                      color: #f2f2f2;
                    "
                    >{{ phone }}</a
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
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
              border: 1px solid #4d4d4d;
              border-radius: 4px;
              background-color: #0d0d0d;
              padding: 16px;
              margin-bottom: 4px;
            "
          >
            <tbody>
              <tr>
                <td>
                  <img
                    src="https://placehold.co/48x48"
                    :alt="website"
                    width="48"
                    height="48"
                  />
                </td>
              </tr>

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
                        <td style="padding: 16px 0">
                          <p
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 20px;
                              font-weight: 700;
                              margin: 0;
                              color: #f2f2f2;
                            "
                          >
                            {{ companyName }}
                          </p>
                          <p
                            style="
                              font-family: Arial, sans-serif;
                              font-size: 16px;
                              font-weight: 400;
                              margin: 0;
                              color: #f2f2f2;
                            "
                          >
                            {{ companyTagline }}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px">
                          <template
                            v-for="(link, index) in bodyLinks"
                            :key="link.url"
                          >
                            <a
                              :href="link.url"
                              style="
                                display: block;
                                text-decoration: none;
                                font-family: Arial, sans-serif;
                                font-size: 14px;
                                font-weight: 400;
                                color: #f2f2f2;
                                margin-bottom: 4px;
                              "
                              >{{ link.text }}</a
                            >
                          </template>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

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
                        <td
                          style="
                            border-top: 1px solid #4d4d4d;
                            padding-top: 16px;
                          "
                        >
                          <template
                            v-for="(link, index) in socialLinks"
                            :key="link.url"
                          >
                            <a
                              :href="link.url"
                              style="
                                display: inline-block;
                                text-decoration: none;
                                font-family: Arial, sans-serif;
                                font-size: 12px;
                                font-weight: 400;
                                color: #f2f2f2;
                              "
                              >{{ link.text }}</a
                            >
                            <span
                              v-if="index < socialLinks.length - 1"
                              style="
                                display: inline-block;
                                vertical-align: middle;
                                width: 3px;
                                height: 3px;
                                background: #4d4d4d;
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
</template>

<script>
export default {
  name: "DarkEdge",
  props: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    companyName: { type: String, required: true },
    companyTagline: { type: String, default: "" },
    website: { type: String, default: "" },
    bodyLinks: { type: Array, default: () => [] },
    socialLinks: { type: Array, default: () => [] },
  },
};
</script>
