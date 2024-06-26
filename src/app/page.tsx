"use client"

import {Cluster,clusterApiUrl,Connection,PublicKey,Keypair} from "@solana/web3.js";
import { encodeURL, createQR,findReference, FindReferenceError, validateTransfer } from "@solana/pay";
import BigNumber from "bignumber.js";
import { useState } from "react";
import QRCode from "react-qr-code";

export default function Home() {
  const api_key = process.env.HELIUS_API_KEY!
  const RPC=`https://rpc.helius.xyz/?api-key=${api_key}`!
  console.log('Connecting to the Solana network\n');
  const connection = new Connection(RPC,'confirmed');

// URL Variables
  const [address, setAddress] = useState("");
  const [recipient, setRecipient] = useState(
    new PublicKey("5SVgMJHrMLYGfPw9nYpPuH6DDWpbNAbs5Dm7kyyREhRR"));
  const [amount, setAmount] = useState(new BigNumber(1));
  const [message, setMessage] = useState("Helius Demo Order");
  const reference = new Keypair().publicKey;
  const label = "Helius Super Store";
  const memo = "Helius#4098";

  // for the QR code
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');


  async function createPayment() {
    console.log("Creating a payment URL \n");
    setRecipient(new PublicKey(address));
    const url = encodeURL({
      recipient,
      amount,
      reference,
      label,
      message,
      memo,
    });

    setQrCodeValue(url.toString()); // convert URL object to string
    checkPayment();
  }


  async function checkPayment() {
    // update payment status
    setPaymentStatus('pending');
    // search for transaction
    console.log('Searching for the payment\n');
    let signatureInfo;
    const {signature} : {signature : any} = await new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            console.count('Checking for transaction...'+reference);
            try {
                signatureInfo = await findReference(connection, reference, { finality: 'confirmed' });
                console.log('\n Signature: ', signatureInfo.signature,signatureInfo);
                clearInterval(interval);
                resolve(signatureInfo);
            } catch (error: any) {
                if (!(error instanceof FindReferenceError)) {
                    console.error(error);
                    clearInterval(interval);
                    reject(error);
                }
            }
        }, 250);
    });
    // Update payment status
    setPaymentStatus('confirmed');
    //validate transaction
    console.log('Validating the payment\n');
    try {
      await validateTransfer(connection, signature, { recipient: recipient, amount });
      // Update payment status
      setPaymentStatus('validated');
      console.log('Payment validated');
      return true;
      
    } catch (error) {
      console.error('Payment failed', error);
      return false;
    }
  }

  
//validate transaction
return (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <h1 className="mb-6 text-3xl font-bold text-orange-700">
      $SOL PAY
    </h1>
    <div className="w-full max-w-md p-6 mx-auto bg-white rounded-xl shadow-md">
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Address:
        </label>
        <input
          type="text"
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Amount:
        </label>
        <input
          type="number"
          onChange={(e) => setAmount(new BigNumber(e.target.value))}
          className="w-full px-3 py-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
        />
      </div>
      <div className="flex justify-center items-center">
      <button 
        className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700" 
        onClick={createPayment}
      >
        Create QR Code
      </button>
      </div>
      
      <div>
      {paymentStatus === 'validated' ? <p className="mt-4 text-green-500 text-center">Payment Validated</p> : <div className="flex justify-center mt-4">
        {qrCodeValue && <QRCode
          size={256}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          value={qrCodeValue}
          viewBox={`0 0 256 256`}
          />}
      </div>}
    </div>
    </div>
    
  </div>
);
}
