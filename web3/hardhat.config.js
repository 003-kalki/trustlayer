require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env.local" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    polygonAmoy: {
      url: "https://rpc-amoy.polygon.technology/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : ["0x0000000000000000000000000000000000000000000000000000000000000000"],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "../src/artifacts" // Output ABIs inside the Next.js src folder so the frontend can read them!
  }
};
