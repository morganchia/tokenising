const { generateMetadataFile } = require('./server/app/controllers/dtscf.controller.js'); 
// Ensure the path to your controller is correct

async function fixToken1() {
  try {
    console.log("Generating fresh metadata for Token #1...");
    
    // Use the exact values Token #1 is supposed to have
    const cleanJsonUrl = await generateMetadataFile(
      "0x59ad1288a8133E1D9b10F73A4a1dF14CDE777EC4", // Your contract
      1,                                            // Token ID
      100,                                          // Value
      1,                                            // Milestone ID
      1735689600,                                   // Example Maturity Date
      "Corrected conditions"
    );

    console.log("-----------------------------------------");
    console.log("NEW CORRECTED URI:", cleanJsonUrl);
    console.log("-----------------------------------------");
    console.log("Now use the 'setTokenURI' script with this new link.");
    
  } catch (err) {
    console.error("Repair failed:", err.message);
  }
}

fixToken1();