import { Env } from "./types"

const env: Env = {
  nodeMailerTransportOptions: {
    service: "hotmail",
    auth: {
      user: "my.name.123@hotmail.com",
      pass: "abcdef",
    },
  },

  imapOptions: {
    user: "my.name.123@hotmail.com",
    password: "abcdef",
    host: "outlook.office365.com",
    port: 993,
    tls: true,
  },

  fromOptions: {
    name: "My Name",
    address: "my.name.123@hotmail.com",
  },

  name: {
    first: "My",
    last: "Name",
  },
}

export default env
