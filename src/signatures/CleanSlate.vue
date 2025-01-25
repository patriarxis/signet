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
              background-color: #f2f2f2;
              border: 1px solid #d1d1d1;
              border-radius: 4px;
              padding: 16px;
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
                      color: #333333;
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
                      margin-top: 4px;
                      color: #666666;
                    "
                  >
                    {{ description }}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0">
                  <template v-for="(link, index) in bodyLinks" :key="link.url">
                    <a
                      :href="link.url"
                      style="
                        display: block;
                        text-decoration: none;
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        font-weight: 400;
                        color: #333333;
                        margin-bottom: 4px;
                      "
                      >{{ link.text }}</a
                    >
                  </template>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 12px; border-top: 1px solid #d1d1d1">
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
                        color: #666666;
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
                        background: #d1d1d1;
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
</template>

<script>
export default {
  name: "CleanSlate",
  props: {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    website: { type: String, default: "" },
    bodyLinks: { type: Array, default: () => [] },
    socialLinks: { type: Array, default: () => [] },
  },
};
</script>
