import React from 'react';
import { useState, useEffect } from "react";
import QrContainer from "./QrContainer.js";
import Web3 from 'web3'

//import DSGDContract_jsonData from '../abis/ERC20TokenDSGD.abi.json';
import PBMContract_jsonData from './ERC20TokenPBM.abi.json';



export default function App() {

	const queryParams = new URLSearchParams(window.location.search)
	const thisid = queryParams.get("id")
	console.log("querystring:"+thisid);


	const [pgNum, setPgNum] = useState(0);
	const [dollar1Count, setDollar1Count] = useState(2);
	const [dollar2Count, setDollar2Count] = useState(1);
	const [dollar5Count, setDollar5Count] = useState(2);
	const [pinCount, setPinCount] = useState(0);

	const INFURA_API_KEY = "9e5e7f94e05c4a7ea7bc11400626dc0b";
	//const CONTRACT_OWNER_WALLET = "0x35f4b28D730398992525F0f6Cf5b6D1d94c98feA";
	const ETHEREUM_NETWORK = "polygon-mumbai";
    // Retail customer: 0x0b3C84364AE77D457FC70e28093F489799B029f3
	const APP_SIGNER_PRIVATE_KEY = "391912590f96da5cd0ba25e2074f6d6fbe4abd8db34ee52b59fb3258e75f62dd";

	const PBMContract_abi =  JSON.parse(JSON.stringify(PBMContract_jsonData));
	const DSGDContractAddr  = "0xB630C97E5AE0d30D75b438E8E3254fB07E9CF0F2";
    const PBMContractAddr1  = "0x5aCE3e17AF560559C1b8C6398657746D4bDcFCF8";
    const PBMContractOwner1 = "0xf72e9F9a9a5F0e031d2507692b884b4444133688"; // PBM smart contract owner
    const connectedAccount  = "0x0b3C84364AE77D457FC70e28093F489799B029f3"; // Retail customer 1

	useEffect(() => {
		//////
	}, []);


	async function send2wallet(amount2send, ONSaddress) {
		const web3 = window.web3;

		var amountToSend = amount2send * 1e18;

		try {  // try 1
		  // https://stackoverflow.com/questions/67736753/using-local-private-key-with-web3-js
		  const createInstance = () => {
			const bscProvider = new Web3(
			  new Web3.providers.HttpProvider(
				`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
			  ),
			);
			console.log("PBM Contract Addr: "+ PBMContractAddr1);
			const web3BSC = new Web3(bscProvider);
			const transactionContractInstance = new web3BSC.eth.Contract(
			  PBMContract_abi,
			  PBMContractAddr1,
			);
			return { web3BSC, transactionContractInstance };
		  }; // createInstance

		  const sendPBM = async () => {  //parameters you need
			try {  // try 2
			  const contractInstance = createInstance();   // executing via Infura using PBMcontractowner's private key
			  console.log("wrapMint(): From ("+PBMContractAddr1+"), To ("+connectedAccount+")");

			  const merchantWalletAddr =
			  await contractInstance.transactionContractInstance.methods
			  .queryCustomEntry(
				ONSaddress 
			  )
			  .call().then((walletAddr) => {
				console.log("Merchant Wallet Addr: ", walletAddr)
				return walletAddr;
			  })
			  .catch((error2) => {
				console.log("Error while querying merchant wallet addr: ", error2)
				return 0;  // if error return 0
			  });
			  console.log("Lookup Merchant wallet address: ", merchantWalletAddr);
			  const nonce = await contractInstance.web3BSC.eth.getTransactionCount(connectedAccount, "latest") //get latest nonce

			  const tx = {
				//nonce: nonce,
				// this is the address responsible for this transaction
				from: connectedAccount,
				// target address, this could be a smart contract address
				to: PBMContractAddr1,
				// gas fees for the transaction
				// this encodes the ABI of the method and the arguments
				data: await contractInstance.transactionContractInstance.methods
				  .redeem(
					merchantWalletAddr, amountToSend.toString()
				  )
				  .encodeABI(),
				gas: 210000,
				//gasPrice: 500,
				gasPrice: await contractInstance.web3BSC.eth.getGasPrice(),
			  };
///
/*
            const nonce = await web3.eth.getTransactionCount(connectedAccount, "latest") //get latest nonce
            //let decimalPlaces = countDecimals(req.body.transferAmount);
            //let tokensToTransfer = (req.body.transferAmount*10**decimalPlaces.toString())  // shift decimals  
			//+ createStringWithZeros(adjustdecimals - decimalPlaces);  // pad zeros behind
            //console.log("tokensToTransfer = ", tokensToTransfer);
            const createTransaction = await web3.eth.accounts.signTransaction( // inside approveDraftById
              {
                nonce: nonce,
                from: connectedAccount,
                to: PBMContractAddr1,
                data: contractInstance.transactionContractInstance.methods.transfer(
					merchantWalletAddr, 
                  //req.body.transferAmount * adjustdecimals 
                    amountToSend.toString()
                  ).encodeABI(),
                gas: 4700000,
              },
              APP_SIGNER_PRIVATE_KEY
            );
///
*/
			  console.log("Create send txn data to merchant wallet: ", tx.data);

			  // sign the transaction with a private key. It'll return messageHash, v, r, s, rawTransaction, transactionHash
			let signPromise;

			try {
				signPromise = await contractInstance.web3BSC.eth.accounts.signTransaction(
				  tx,
				  APP_SIGNER_PRIVATE_KEY,
				);
			  console.log("Create signPromise: ", signPromise);
			} catch(err2) {
				console.log("Error while signing TX:" + err2);
			}

			  // the rawTransaction here is already serialized so you don't need to serialize it again
			  // Send the signed txn
			  const sendTxn =
				await contractInstance.web3BSC.eth.sendSignedTransaction(
				  signPromise.rawTransaction,
				  (error1, hash) => {
					if (error1) {
						console.log("Something went wrong when submitting your signed transaction:", error1)
					} else {
						console.log("Txn sent!, hash: ", hash);
						var timer = 1;
						// retry every second to chk for receipt
						const interval = setInterval(() => {
							console.log("Attempting to get transaction receipt...");

							// https://ethereum.stackexchange.com/questions/67232/how-to-wait-until-transaction-is-confirmed-web3-js
							web3.eth.getTransactionReceipt(hash, (error3, receipt) => {
								if (receipt) {
									clearInterval(interval);

									console.log('--> RECEIPT received <--');
									console.log('Receipt: ', receipt);
									if (receipt.status) {  // true === success
									  alert("Transaction status: Success");
							  
									} else {
									  alert("Transaction status: Failed! ");
									  clearInterval(interval);
									}
								}
								if (error3) {
									console.log("!! getTransactionReceipt error: ", error3)
									clearInterval(interval);
								}
							});
							timer++;
						}, 1000);
					}
				})
			  .on("error", err => {
				  console.log("sentSignedTxn error: ", err)
				  // do something on transaction error
			  });
			  console.log("sendSignedTxn: ", sendTxn);
              alert("Transaction success, PBM redeemed!");
			  
			  return Promise.resolve(sendTxn);
			} catch(error) {
			  throw error;
			} // try 2
		  } // function sendPBM
		  
		  await sendPBM();
		  
		} catch(err){
		  console.log(err);
		}  // try 1
	}
	
	
	// https://bobbyhadz.com/blog/react-pass-data-from-child-to-parent
	const handleCallback = (data) => {
		// Update the name in the component's state
	//        this.setState({ scandata: data }) 
//		alert('QRCode scan data='+data);
		console.log('QRCode scan data='+data);
		
		send2wallet(1, data);
		//GotoNextPg
		//setPgNum( pgNum +1 );
		setBgImgName(bgImg[pgNum +1]);
		setPgNum( pgNum => pgNum +1 );
		console.log('pgNum='+ (pgNum +1) );
	}


	const bgImg = ["/p2.jpg", "/p3.jpg", "/q1.jpg", "/q2.jpg", "/q3x.jpg","/q4.jpg","","/q6.jpg","/q7.jpg","/q8.jpg","/q9.jpg","/q1a.jpg"];
	const dots = ["/q7_0_dot.jpg","/q7_1_dot.jpg","/q7_2_dot.jpg","/q7_3_dot.jpg","/q7_4_dot.jpg","/q7_5_dot.jpg","/q7_6_dot.jpg"];
	const [bgImgName, setBgImgName] = useState(bgImg[pgNum]);

	const myStyle={
		backgroundImage: `url(${bgImgName})`,
		height: '100vh',
		backgroundPosition: 'center',
		backgroundRepeat: 'no-repeat',
		backgroundSize: 'cover',
		overflow: 'auto',
	};

  const img1finance = {
    position: 'absolute',
    bottom: '0px',
    width: '18%',
    border: 'solid 3px red',
    opacity: 0,  // transparent
  };
  const img2web3logo = {
    position: 'absolute',
    left: '110px',
    bottom: '0px',
    width: '20%',
    height: '18%',
    border: 'solid 3px orange',
    opacity: 0,  // transparent
  };
  const img3send = {
    position: 'absolute',
    right: '25px',
    bottom: '0px',
    width: '50%',
	height: '15%',
    border: 'solid 3px red',
    opacity: 0,  // transparent
  };
  const img4vouchers = {
    position: 'absolute',
    left: '20px',
    top: '80px',
    width: '40%',
	height: '15%',
    border: 'solid 3px red',
    opacity: 0,  // transparent
  };
  const img5_q3a_1dollar = {
    position: 'absolute',
    left: '23px',
    top: '85px',
    width: '40%',
    border: 'solid 3px red',
    opacity: 0,  // transparent
  };  
  const img5_q3a_2dollar = {
    position: 'absolute',
    left: '205px',
    top: '85px',
    width: '40%',
    border: 'solid 3px red',
    opacity: 0,  // transparent
  };
  const img5_q3a_5dollar = {
    position: 'absolute',
    left: '23px',
    top: '314px',
    width: '40%',
    border: 'solid 3px red',
    opacity: 0,  // transparent
  };
  const img5_q3x_continue = {
    position: 'absolute',
    left: '0px',
    bottom: '0px',
    width: '110%',
    border: 'solid 3px red',
    opacity: 0,  // transparent
  };
  const img6scanqr = {
    position: 'absolute',
    left: '20px',
    bottom: '150px',
    width: '90%',
	height: '20%',
    border: 'solid 3px green',
    opacity: 0,  // transparent
  };
  const img8proceedtosend = {
    position: 'absolute',
    left: '22px',
    bottom: '0px',
    width: '90%',
	height: '12%',
    border: 'solid 3px red',
    opacity: 0,  // transparent
  };
  const img9akeyboard = {
    position: 'absolute',
    left: '0px',
    bottom: '60px',
    width: '100%',
    border: 'solid 3px red',
    opacity: 0,  // transparent
  };
  const img9bkeyboard = {
    position: 'absolute',
    right: '135px',
    bottom: '0px',
    width: '34%',
    border: 'solid 3px red',
    opacity: 0,  // transparent
  };
  const img9ckeyboard = {
    position: 'absolute',
    right: '0px',
    bottom: '0px',
    width: '35%',
    border: 'solid 3px red',
    opacity: 0,  // transparent
  };
  const img9_dots = {
    position: 'absolute',
    right: '0px',
    top: '0px',
    width: '100%',
  };
  const img10_great = {
    position: 'absolute',
    right: '15px',
    bottom: '10px',
    width: '95%',
	height: '12%',
    border: 'solid 3px red',
    opacity: 0,  // transparent
  };

  const containerPg1 = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100hh',
  };

  const containerPg6 = {
    position: 'absolute',
    top: '0px',
    left: '0px',
    width: '100%',
	height: '100%',
  };

  const GotoNextPg =  event => {
    console.log('Now in page:'+pgNum);

    setBgImgName(bgImg[pgNum+1]);
    setPgNum( pgNum +1 );
    console.log('Going to page:'+pgNum);

    console.log(event.target);
  };

  const GotoPg2 = event => {
    if ( dollar1Count > 0) {
      setPgNum( 2 );
      console.log('setPage:2');
      setBgImgName(bgImg[2]);

    }
    else {
      setPgNum( 11 );
      console.log('setPage:11');
      setBgImgName(bgImg[11]);

    }
    //setBgImgName(bgImg[pgNum]);
    //console.log(event.target);
    //console.log('Going to pagexxxx:'+pgNum);
  };


  const AddDollar1 = event => {
    dollar1Count === 0? setDollar1Count(1): setDollar1Count(0); 
    console.log(event.target);
    console.log('AddDollar:1');
  };
  const AddDollar2 = event => {
    dollar2Count === 0? setDollar2Count(1): setDollar2Count(0); 
    console.log(event.target);
    console.log('AddDollar:2');
  };
  const AddDollar5 = event => {
    dollar5Count === 0? setDollar5Count(1): setDollar5Count(0); 
    console.log(event.target);
    console.log('AddDollar:5');
  };
  
  function GoNextPage(x) {
	  setBgImgName(bgImg[x]);
      setPgNum( pgNum => x );
      console.log('pgNum='+x );
  }
  
  const InputPin = async event => {
    
    setPinCount(pinCount + 1)

    console.log(event.target);
    console.log('InputPIN: pinCount='+pinCount);      

    if (pinCount >= 5 )
    {
      //GotoNextPg
      //setPgNum( pgNum +1 );

      await timeout(1000); //for 1 sec delay
//	  GoNextPage(pgNum +1);
//	  const myTimeout = setTimeout(GoNextPage(pgNum +1), 1000); ///zzzz

      setBgImgName(bgImg[pgNum+1]);
      setPgNum( pgNum => pgNum +1 );
      console.log('pgNum='+pgNum +1 );

//clearTimeout(myTimeout);

//	  const myTimeout2 = setTimeout(GoNextPage(10), 5000); ///zzzz

      await timeout2(5000); //for 5 sec delay, then load another page
//	  GoNextPage(10);
	  

      setPgNum( 10 );
      setBgImgName(bgImg[10]);
      console.log('pgNum=10');

      setDollar1Count(0);
      setDollar2Count(0);
      setDollar5Count(0);


    }
  };
  const InputBS = event => {
    if (pinCount > 0 )
      setPinCount(pinCount - 1); 

    console.log(event.target);
    console.log('InputBS: pinCount='+pinCount);

  };
  const Input6 = event => {
	// user input 6 digits, not we do a axios to merchant website

    console.log(event.target);
    console.log('InputBS: pinCount='+pinCount);

  };

  function timeout(delay) {
    return new Promise( res => setTimeout(res, delay) );
  }

  function timeout2(delay) {
    return new Promise( res => setTimeout(res, delay) );
  }
  

	return (
    <>
	  <meta name="apple-mobile-web-app-capable" content="yes" />
	  <meta name="mobile-web-app-capable" content="yes" />

      <div style={myStyle}>
      </div>    
      <div style={containerPg1}>
        {
          pgNum === 0 ? 
		  <>
            <img 
              src="/finance_icon.jpg" 
              alt="logo" 
              style={img1finance} 
              onClick={GotoNextPg}
            />
		  </>
          : 
            ""
        }
      <div>
      </div>
        {
          pgNum === 1 ? 
            <img 
              src="/p3_web3.jpg" 
              alt="logo" 
              style={img2web3logo} 
              onClick={GotoPg2}
            />
          : 
            ""
        }
                {
          pgNum === 2 ? 
            <img 
              src="/q1_send.jpg" 
              alt="logo" 
              style={img3send} 
              onClick={GotoNextPg}
            />
          : 
            ""
        }
        {
          pgNum === 3 ? 
            <img 
              src="/q2_vouchers.jpg" 
              alt="logo" 
              style={img4vouchers} 
              onClick={GotoNextPg}
            />
          : 
            ""
        }
        {
          pgNum === 4 ? 
            (dollar1Count === 0 ? 
              <img 
                src="/q3a_1dollar.jpg" 
                alt="logo" 
                style={img5_q3a_1dollar} 
                onClick={AddDollar1}
              />
            : 
            <img 
              src="/q3a_1dollarSelected.jpg" 
              alt="logo" 
              style={img5_q3a_1dollar} 
              onClick={AddDollar1}
            />
            )
            :
            ""
        }
        {
          pgNum === 4 ? 
            ( dollar2Count === 0 ? 
              <img 
                src="/q3a_2dollar.jpg" 
                alt="logo" 
                style={img5_q3a_2dollar} 
                onClick={AddDollar2}
              />
            : 
            <img 
              src="/q3a_2dollarSelected.jpg" 
              alt="logo" 
              style={img5_q3a_2dollar} 
              onClick={AddDollar2}
            />
            )
          :
          ""
        }
        {
          pgNum === 4 ? 
            (dollar5Count === 0 ? 
              <img 
                src="/q3a_5dollar.jpg" 
                alt="logo" 
                style={img5_q3a_5dollar} 
                onClick={AddDollar5}
              />
            : 
            <img 
              src="/q3a_5dollarSelected.jpg" 
              alt="logo" 
              style={img5_q3a_5dollar} 
              onClick={AddDollar5}
            />) 
            :
            ""
        }
        {
          pgNum === 4 ?

            ! (dollar1Count === 0 && dollar2Count === 0 && dollar5Count === 0) ? 

            <img 
                src="/q3x_continue.jpg" 
                alt="continue" 
                style={img5_q3x_continue} 
                onClick={GotoNextPg}
            />
            :
            ""
          :
          ""
        }
        {
          pgNum === 5 ? 
            <img 
              src="/q4_scan.jpg" 
              alt="logo" 
              style={img6scanqr} 
              onClick={GotoNextPg}
            />
          : 
            ""
        }
        {
          pgNum === 6 ? 
		  <div style={containerPg6}>
				<QrContainer parentCallback={handleCallback} />
		  </div>
          : 
            ""
        }
        {
          pgNum === 7 ? 
            <img 
              src="/q6_send.jpg" 
              alt="logo" 
              style={img8proceedtosend} 
              onClick={GotoNextPg}
            />
          : 
            ""
        }
        {
          pgNum === 8 ? 
            <img 
              src="/q7_keyboard1.jpg" 
              alt="logo" 
              style={img9akeyboard} 
              onClick={InputPin}
            />
          : 
            ""
        }
        {
          pgNum === 8 ? 
            <img 
              src="/q7_keyboard2.jpg" 
              alt="logo" 
              style={img9bkeyboard} 
              onClick={InputPin}
            />
          : 
            ""
        }
        {
          pgNum === 8 ? 
            <img 
              src="/q7_keyboard_backspace.jpg" 
              alt="logo" 
              style={img9ckeyboard} 
              onClick={InputBS}
            />
          : 
            ""
        }
        {
          pgNum === 8 && (pinCount >= 0 && pinCount <=6) ? 
            <img 
              src={dots[pinCount]} 
              alt="logo" 
              style={img9_dots} 
            />
          : 
            ""
        }
        {
          pgNum === 10 ? 
            <img 
              src="/q9_great.jpg" 
              alt="logo" 
              style={img10_great} 
              onClick={GotoPg2}
            />
          : 
            ""
        }

      </div>
    </>	
  );
}
