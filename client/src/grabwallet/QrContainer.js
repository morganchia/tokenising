import React, { useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode';

// 

const QrContainer = ({parentCallback}) => {

  // https://github.com/mebjas/html5-qrcode/issues/641
  let html5QrCode;

  useEffect(() => {
	if(!html5QrCode?.getState()){

		html5QrCode = new Html5Qrcode("reader");
		const qrCodeSuccessCallback = (decodedText, decodedResult) => {
			/* handle success */
//			if (decodedText === '0xPayPitstopPackMerchant') {
				//alert(decodedText);		

				html5QrCode.stop();
				parentCallback(decodedText);

//			}
		};
		
		const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.777778};

try {
		//html5QrCode.clear();
		html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
//		html5QrCode.start({ facingMode: "user" }, config, qrCodeSuccessCallback)
		.catch(err => {
			// Start failed, handle it.
			//html5QrCode.stop();
			alert('Please restart and allow usage of mobile phone camera to proceed...');		
		});
} catch(e){
				alert('Please restart and allow usage of mobile phone camera to proceed...');		

}

	}
	return () => {
		// Anything in here is fired on component unmount.
/*
		if(html5QrCode?.getState()){
			html5QrCode.stop();
			html5QrCode.clear();
		}
*/
	};
  }, []);


  return (
    <div className="App">
          <div id="reader" style={{height: "100%"}}></div>
    </div>
  );
}
export default QrContainer;

