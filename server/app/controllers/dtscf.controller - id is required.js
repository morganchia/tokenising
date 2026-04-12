const db = require("../models");
const DTSCFProject = db.dtscfprojects;
const AuditTrail = db.audittrail;
const Dtscf_Drafts = db.dtscf_drafts;
const Dtscf = db.dtscf;
const Milestone = db.milestones;
const Contractor = db.contractors;
const Purchase = db.purchases;
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Assume configured
const Op = db.Sequelize.Op;
const { logDataValues } = require('../utils/logDataValues');

// Absolute paths from __dirname (server/app/controllers)
/*
const smartContractFile = "./server/app/contracts/ERC1155Tokenised_Payable.sol";
const abiFile = "./server/app/abis/ERC1155Tokenised_Payable.abi.json";
const byteCodeFile = "./server/app/abis/ERC1155Tokenised_Payable.bytecode.json";
const smartContractFileName = "ERC1155Tokenised_Payable.sol";
const TokenName = "TokenizedPayable";
*/
const smartContractFile = path.join(__dirname, '../contracts/ERC1155Tokenised_Payable.sol');
const abiFile = path.join(__dirname, '../abis/ERC1155Tokenised_Payable.abi.json');
const byteCodeFile = path.join(__dirname, '../abis/ERC1155Tokenised_Payable.bytecode.json');
const smartContractFileName = "ERC1155Tokenised_Payable.sol";
const TokenName = "TokenizedPayable";
const tokenizedBank_abiFile = path.join(__dirname, '../abis/ERC20TokenDSGD.abi.json');
const tokenizedBank_byteCodeFile = path.join(__dirname, '../abis/ERC20TokenDSGD.bytecode.json');


var newcontractaddress = null;
const adjustdecimals = 18;
const TIMEOUT = 700;

function createStringWithZeros(num) { return ("0".repeat(num)); }

retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000, shouldRetry = () => true) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!shouldRetry(err) || attempt === maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      console.warn(`Retry attempt ${attempt} after ${delay}ms: ${err.message}`);
    }
  }
};

// Function to scale a number with up to 3 decimal places to a BigNumber with 18 decimal places
function scaleToWei(value) {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
        throw new Error('Invalid number input for scaling');
    }
    // Convert to string with 3 decimal places and scale to wei (10^18)
    return web3.utils.toWei(parsed.toFixed(3), 'ether');
}

// Recursive function to create contractors and subcontractors
async function createContractors(contractors, projectId, files, parentId = null, path = []) {
  for (const [index, con] of contractors.entries()) {
    const draftContractor = await db.dtscf_contractors_draft.create({
      name: con.name,
      budget: parseInt(con.budget) || 0,
      walletaddress: con.walletaddress || '',
      dtscf_project_id: projectId,
      dtscf_parent_contractor_id: parentId,
      dtscf_milestone_id: con.milestone_id || null  // New field for milestone association
    });
    console.log(`Created new contractor with id=${draftContractor.id}`);


    const currentPath = [...path, index];

    for (const [purIndex, pur] of (con.purchases || []).entries()) {
      const fieldBase = `contractor_${currentPath.join('_')}_purchase_${purIndex}_invoice`;
      const invoiceFile = files[fieldBase] ? files[fieldBase][0] : null;

      const newPurchase = await db.dtscf_purchases_draft.create({
        description: pur.description,
        amount: parseFloat(pur.amount) || 0,
        dtscf_project_id: projectId,
        dtscf_contractor_id: draftContractor.id,
        invoice_blob: invoiceFile ? invoiceFile.buffer : null
      });
      console.log(`Created new purchase with id=${newPurchase.id}`);    
    }

    if (con.subcontractors && con.subcontractors.length > 0) {
      await createContractors(con.subcontractors, projectId, files, draftContractor.id, currentPath);
    }
  }
}

// Create and Save a new Dtscf draft
exports.draftCreate = async (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      return res.status(500).send({ message: "Error parsing form data" });
    }

    var errorSent = false;

    if (!req.body.name) {
      if (!errorSent) {
        res.status(400).send({
          message: "Content can not be empty!"
        });
        errorSent = true;
      }
      return;
    }

    console.log("Received for Dtscf draft Create:");
    console.log(req.body);

    try {
      // Parse main project data
      const projectData = {
        name              : req.body.name,
        description       : req.body.description,
        totalBudget       : parseInt(req.body.totalBudget) || 0,
        blockchain        : req.body.blockchain || 0, // Default or from form
        underlyingTokenID : req.body.underlyingTokenID || null,
        underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
        campaign_id        : req.body.campaign_id || null,

        startdate         : req.body.startdate,
        enddate           : req.body.enddate,

        txntype           : 0, // Create
        status            : 1,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
        actionby          : req.body.actionby, // Assuming auth service
        actiontimedate    : new Date(),
        maker             : req.body.maker,
        checker           : req.body.checker,
        approver          : req.body.approver,
        checkerComments   : req.body.checkerComments || '',
        approverComments  : req.body.approverComments || ''
      };

      // Create the draft project
      const draftProject = await Dtscf_Draft.create(projectData);

      // Parse and create milestones
      const milestones = JSON.parse(req.body.milestones || '[]');
      for (const ms of milestones) {
        await db.dtscf_milestones_draft.create({
          name: ms.name,
          budget: parseInt(ms.budget) || 0,
          startdate: ms.startdate,
          enddate: ms.enddate,
          dtscf_project_id: draftProject.id
        });
      }

      // Parse and create contractors with purchases recursively
      const contractors = JSON.parse(req.body.contractors || '[]');
      await createContractors(contractors, draftProject.id, req.files);

      // Log to audittrail
      await AuditTrail.create({
        action: "Dtscf project draft creation",
        name: projectData.name,
        actionby: projectData.actionby,
        actiontimedate: projectData.actiontimedate,
        //data: logDataValues(draftProject)
      });

      res.send({
        message: "Draft created successfully!"
      });
    } catch (err) {
      console.error(err);
      if (!errorSent) {
        res.status(500).send({
          message: err.message || "Some error occurred while creating the draft."
        });
        errorSent = true;
      }
    }
  });
};  // draftCreate

exports.create_review = async (req, res) => {
  // Validate request

  var errorSent = false;

  if (!req.body.name) {
    if (!errorSent) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
      errorSent = true;
    }
    return;
  }

  console.log("Received for Dtscf Review:");
  console.log(req.body);

  await Dtscf_Draft.update(
      { 
        checkerComments :   req.body.checkerComments,
        status          : 2,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
      }, 
      { where:      { id: id }},
      )
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Dtscf status has been updated successfully."
          });
        } else {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update Dtscf with id=${id}. Maybe Dtscf was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({
          message: `Error updating Dtscf. ${err}`
        });
      }); 
}; // create_review

// Recursive function for update or create contractors
async function updateOrCreateContractors(contractors, projectId, files, parentId = null, path = []) {
  for (const [index, con] of contractors.entries()) {
    let contractorId;
    if (con.id) {
      // Update existing
      const num = await db.dtscf_contractors_draft.update({
        name: con.name,
        budget: parseInt(con.budget) || 0,
        walletaddress: con.walletaddress || '',
        dtscf_milestone_id: con.milestone_id || null
      }, { where: { id: con.id } });
      if (num[0] === 1) {
        console.log(`Updated contractor with id=${con.id}`);
      } else {
        console.log(`No changes or cannot update contractor with id=${con.id}. Rows affected: ${num[0]}`);
      }
      contractorId = con.id;
    } else {
      // Create new
      const draftContractor = await db.dtscf_contractors_draft.create({
        name: con.name,
        budget: parseInt(con.budget) || 0,
        walletaddress: con.walletaddress || '',
        dtscf_project_id: projectId,
        dtscf_parent_contractor_id: parentId,
        dtscf_milestone_id: con.milestone_id || null
      });
      console.log(`Created new contractor with id=${draftContractor.id}`);
      contractorId = draftContractor.id;
    }

    const currentPath = [...path, index];

    for (const [purIndex, pur] of (con.purchases || []).entries()) {
      const fieldBase = `contractor_${currentPath.join('_')}_purchase_${purIndex}_invoice`;
      const invoiceFile = files[fieldBase] ? files[fieldBase][0] : null;

      if (pur.id) {
        // Update existing purchase
        const num = await db.dtscf_purchases_draft.update({
          description: pur.description,
          amount: parseFloat(pur.amount) || 0,
          invoice_blob: invoiceFile ? invoiceFile.buffer : undefined  // Skip if no new file
        }, { where: { id: pur.id } });
        if (num[0] === 1) {
          console.log(`Updated purchase with id=${pur.id}`);
        } else {
          console.log(`No changes or cannot update purchase with id=${pur.id}. Rows affected: ${num[0]}`);
        }
      } else {
        // Create new purchase
        const newPurchase = await db.dtscf_purchases_draft.create({
          description: pur.description,
          amount: parseFloat(pur.amount) || 0,
          dtscf_project_id: projectId,
          dtscf_contractor_id: contractorId,
          invoice_blob: invoiceFile ? invoiceFile.buffer : null
        });
        console.log(`Created new purchase with id=${newPurchase.id}`);
      }
    }

    if (con.subcontractors && con.subcontractors.length > 0) {
      await updateOrCreateContractors(con.subcontractors, projectId, files, contractorId, currentPath);
    }
  }
}

exports.submitDraftById = async (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      return res.status(500).send({ message: "Error parsing form data" });
    }

    var errorSent = false;

    const draft_id = req.params.id;

    if (!req.body.name) {
      if (!errorSent) {
        res.status(400).send({
          message: "Content can not be empty!"
        });
        errorSent = true;
      }
      return;
    }

    console.log("Received1 submitDraftById:");
    console.log("id=",req.params.id);
    console.log("Received for Dtscf draft Update:");
    console.log(req.body);

    try {
      // Update the draft project
      await Dtscf_Draft.update(
        {
          name              : req.body.name,
          description       : req.body.description,
          totalBudget       : parseInt(req.body.totalBudget) || 0,
          blockchain        : req.body.blockchain || 0, // Default or from form
          underlyingTokenID : req.body.underlyingTokenID || null,
          underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
          campaign_id        : req.body.campaign_id || null,
          startdate         : req.body.startdate,
          enddate           : req.body.enddate,
          txntype           : req.body.txntype, // Create
          status            : 1,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
          actionby          : req.body.actionby, // Assuming auth service
          actiontimedate    : new Date(),
          maker             : req.body.maker,
          checker           : req.body.checker,
          approver          : req.body.approver,
          checkerComments   : req.body.checkerComments || '',
          approverComments  : req.body.approverComments || ''
        },
        { where: { id: draft_id } }
      );

      console.log("Dtscf draft project updated successfully.");

      // Parse and update/create milestones
      const milestones = JSON.parse(req.body.milestones || '[]');
      for (const ms of milestones) {
        if (ms.id) {
          await db.dtscf_milestones_draft.update({
            name: ms.name,
            budget: parseInt(ms.budget) || 0,
            startdate: ms.startdate,
            enddate: ms.enddate,
          }, { where: { id: ms.id } });
        } else {
          await db.dtscf_milestones_draft.create({
            name: ms.name,
            budget: parseInt(ms.budget) || 0,
            startdate: ms.startdate,
            enddate: ms.enddate,
            dtscf_project_id: draft_id
          });
        }
      }

      // Parse and update/create contractors with purchases recursively
      const contractors = JSON.parse(req.body.contractors || '[]');
      await updateOrCreateContractors(contractors, draft_id, req.files);

      // Log to audittrail
      await AuditTrail.create({
        action: req.body.txntype===0?"create - resubmitted":req.body.txntype===1?"update - resubmitted":req.body.txntype===2?"delete - resubmitted":"",
        name: req.body.name,
        totalBudget: req.body.totalBudget,
        blockchain: req.body.blockchain || 0,
        underlyingTokenID: req.body.underlyingTokenID || null,
        underlyingDSGDsmartcontractaddress: req.body.underlyingDSGDsmartcontractaddress || '',
        campaign_id: req.body.campaign_id || null,
        startdate: req.body.startdate,
        enddate: req.body.enddate,
        txntype: req.body.txntype,
        draftdtscfId: draft_id,
        maker: req.body.maker,
        checker: req.body.checker,
        approver: req.body.approver,
        actionby: req.body.actionby,
        checkerComments: req.body.checkerComments,
        approverComments: req.body.approverComments,
        status: 1,   // pending checker
      })
      .then(auditres => {
        console.log("Data written to audittrail for resubmitting dtscf request:", auditres);
      })
      .catch(err => {
        console.log("Error while logging to audittrail for resubmitting dtscf request: "+err.message);
      });

      res.send({
        message: "Dtscf draft updated successfully."
      });
    } catch (err) {
      console.error(err);
      if (!errorSent) {
        res.status(500).send({
          message: err.message || "Some error occurred while updating the draft."
        });
        errorSent = true;
      }
    }
  });
}; // submitDraftById

exports.acceptDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received2 acceptDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  await Dtscf_Draft.update(
  { 
    status :          2,
    checkerComments: req.body.checkerComments,
    approverComments: req.body.approverComments,
  }, 
  { where:      { id: draft_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Dtscf "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - accepted",
          name                  : req.body.name,
          totalBudget           : req.body.totalBudget,
          blockchain            : req.body.blockchain || 0, // Default or from form
          underlyingTokenID     : req.body.underlyingTokenID || null,
          underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
          campaign_id           : req.body.campaign_id || null,

          startdate             : req.body.startdate, 
          enddate               : req.body.enddate,

          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          status                : 2,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for accepting dtscf request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for accepting dtscf request: "+err.message);
      });
      
      res.send({
        message: "Dtscf was accepted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Dtscf with id=${draft_id}. Maybe Dtscf was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Dtscf. ${err}`
    });
  });
}; // acceptDraftById

exports.approveDraftById = async (req, res) => {  // 
  var errorSent = false;
  var updatestatus = false;

  // Validate request
  if (!req.body.name) {
    if (!errorSent) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
      errorSent = true;
    }
    return;
  }
  
  const draft_id = req.params.id;

  console.log("Input data for approveDraftById(), ", req.body);

  if (req.body.txntype !==0     // create dtscf
    && req.body.txntype !==1    // update dtscf
    ) {
      if (!errorSent) {
        res.status(400).send({
          message: "Invalid transaction type!"
        });
        errorSent = true;
      }
      return;  
  }
  const isNewDtscf = (req.body.txntype === 0? true : false); // Create = true, Edit/Update = false

  console.log("Received approveDraftById for Create/Update:");

// Blockchain code remains the same...

  updatestatus = null;
  //updatestatus = await dAppUpdate();
  console.log("exports.update Update status (3):", updatestatus);
  ////////////////////////////// Blockchain ////////////////////////

  if (updatestatus) {
    await Dtscf.update(
      {
        name                  : req.body.name,
        blockchain            : req.body.blockchain || 0, // Default or from form
        underlyingTokenID     : req.body.underlyingTokenID || null,
        underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
        campaign_id           : req.body.campaign_id || null,
        totalBudget           : req.body.totalBudget,

        startdate             : req.body.startdate, 
        enddate               : req.body.enddate,
      }, 
      { where:      { id: draft_id }},
      )
      .then(num => {
        if (num == 1) {

          // write to audit
          AuditTrail.create(
            { 
              action                : "Dtscf "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" update request - approved",
              name                  : req.body.name,
              totalBudget           : req.body.totalBudget,
              blockchain            : req.body.blockchain || 0, // Default or from form
              underlyingTokenID     : req.body.underlyingTokenID || null,
              underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
              campaign_id           : req.body.campaign_id || null,

              startdate             : req.body.startdate, 
              enddate               : req.body.enddate,
              
              txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

              draftdtscfId          : draft_id,
              maker                 : req.body.maker,
              checker               : req.body.checker,
              approver              : req.body.approver,
              actionby              : req.body.actionby,
              checkerComments       : req.body.checkerComments,
              approverComments      : req.body.approverComments,
              status                : 3,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
            }, 
          )
          .then(auditres => {
            console.log("Data written to audittrail for approving dtscf update request:", auditres);

          })
          .catch(err => {
            console.log("Error while logging to audittrail for approving dtscf update request: "+err.message);
          });

          if (!errorSent) {
            res.send({
              message: "Dtscf was updated successfully."
            });
            errorSent = true;
          }
        } else {
          if (!errorSent) {
            res.send({
              message: `${req.body}. Record updated =${num}. Cannot update Dtscf with id=${id}. Maybe Dtscf was not found or req.body is empty!`
            });
            errorSent = true;
          }
        }
      })
      .catch(err => {
        console.log(err);
        if (!errorSent) {
          res.status(500).send({
            message: `Error updating Dtscf. ${err}`
          });
          errorSent = true;
        }
      });
  } else {
    if (!errorSent) {
      res.status(500).send({
        message: "Error updating Dtscf. "
      });
      errorSent = true;
    }
  }
}; // update

exports.rejectDraftById = async (req, res) => {
  var errorSent = false;
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received2 rejectDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  await Dtscf_Draft.update(
  { 
    status :          -1,
    checkerComments: req.body.checkerComments,
    approverComments: req.body.approverComments,
  }, 
  { where:      { id: draft_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Dtscf "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - rejected",
          name                  : req.body.name,
          blockchain            : req.body.blockchain,
        
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          status                : -1,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for rejecting dtscf request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for rejecting dtscf request: "+err.message);
      });
      
      if (!errorSent) {
          res.send({
          message: "Dtscf was rejected."
        });
        errorSent = true;
      }
    } else {
      if (!errorSent) {
        res.send({
          message: `${req.body}. Record updated =${num}. Cannot reject Dtscf with id=${draft_id}. Maybe Dtscf was not found or req.body is empty!`
        });
        errorSent = true;
      }
    }
  })
  .catch(err => {
    console.log(err);
    if (!errorSent) {
      res.status(500).send({
        message: `Error rejecting Dtscf. ${err}`
      });
      errorSent = true;
    }
  });
}; // rejectDraftById

exports.findDraftByNameExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { 
    name: name, 
    status : [-1, 0, 1, 2]  // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
  } : null;

  Dtscf_Draft.findAll(
    { where: condition },
    )
    .then(data => {
      logDataValues("Dtscf_Draft.findAll: ", data);
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving dtscf1 draft: "+err.message);

      res.status(400).send({
        message:
          err.message || "Some error occurred while retrieving dtscf draft."
      });
    });
}; // findDraftByNameExact

exports.findDraftByApprovedId = (req, res) => {
  const id = req.query.id;
  var condition = id ? { 
    approveddtscfid: id, 
    status : [-1, 0, 1, 2]  // status -1=redo, 0, drafted not submitted, 1=pending checker, 2=pending approver, 3=approved
  } : null;

  Dtscf_Draft.findAll(
    { where: condition },
    )
    .then(data => {
      logDataValues("Dtscf_Draft.findAll: ", data);
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving dtscf1 draft: "+err.message);

      res.status(400).send({
        message:
          err.message || "Some error occurred while retrieving dtscf draft."
      });
    });
}; // findDraftByApprovedId

exports.findExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: name } : null;

  Dtscf.findAll(
    { where: condition },
    )
    .then(data => {
      logDataValues("Dtscf.findAll: ", data);
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving dtscf1: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving dtscf."
      });
    });
}; // findExact

exports.getInWalletMintedTotalSupply = (req, res) => {
  
  // get token address from DtscfId
  const Id = req.query.id;
  var condition = Id ? { id: Id } : null;

  //console.log("++++++++++++++Received data:", req)
  
  Dtscf.findAll(
  { 
    where: { id : Id },
  })
  .then(async data => {

    if (!data || data.length === 0) {
      return res.status(404).send({
        message: `Dtscf with id=${Id} not found`
      });
    }

    //console.log("Qery result fo DATA:", data[0].id);

    /// Query blockchain
    // Readng ABI from JSON file
    fs = require("fs");
    ABI = JSON.parse(fs.readFileSync(abiFile).toString());  // <-- dropdown menu

    // Creation of Web3 class
    Web3 = require("web3");

    logDataValues("In Dtscf.findAll: ", data);

    require('dotenv').config();
    const ETHEREUM_NETWORK = (() => {switch (data[0].blockchain) {
          case 80001:
            return process.env.REACT_APP_POLYGON_MUMBAI_NETWORK
          case 80002:
            return process.env.REACT_APP_POLYGON_AMOY_NETWORK
          case 11155111:
            return process.env.REACT_APP_ETHEREUM_SEPOLIA_NETWORK
          case 43113:
            return process.env.REACT_APP_AVALANCHE_FUJI_NETWORK
          case 137:
            return process.env.REACT_APP_POLYGON_MAINNET_NETWORK
          case 1:
            return process.env.REACT_APP_ETHEREUM_MAINNET_NETWORK
          case 43114:
            return process.env.REACT_APP_AVALANCHE_MAINNET_NETWORK
          default:
            return null
        }
      }
    )()

    if (!ETHEREUM_NETWORK) {
      if (!errorSent) {
        res.status(400).send({
          message: "Invalid blockchain network."
        });
        errorSent = true;
      }
      return;
    }

    const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
    const provider = `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
    const Web3Client = new Web3(new Web3.providers.HttpProvider(provider));
    const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;

    // Setting up a HttpProvider
    web3 = new Web3( 
      Web3.providers.HttpProvider(
        `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
      ) 
    );

    const _tokenAddress = data[0].smartcontractaddress;

    console.log("Querying token: ", _tokenAddress);
    const contract1 = new Web3Client.eth.Contract(ABI, _tokenAddress);
  
    var inWallet = 0;
    try {
      const _inWallet = await contract1.methods.balanceOf(1, CONTRACT_OWNER_WALLET).call(); 
      inWallet = await Web3Client.utils.fromWei(_inWallet)
      console.log("In Wallet: ", inWallet);
    } catch (err) {
      console.log("Error while retreiving inWallet: "+err.message);
    }

    var totalMinted = 0
    try {
      const _totalMinted = await contract1.methods._incirculation(1).call(); 
      totalMinted = await Web3Client.utils.fromWei(_totalMinted)
      console.log("total Minted: ", totalMinted);
    } catch (err) {
      console.log("Error while retreiving _incirculation: "+err.message);
    }

    var totalSupply = 0
    try {
      const _totalSupply = await contract1.methods.totalSupply(1).call(); 
      totalSupply = await Web3Client.utils.fromWei(_totalSupply) 
      console.log("total Supply: ", totalSupply);
    } catch (err) {
      console.log("Error while retreiving totalSupply: "+err.message);
    }  
  
    res.send(
      {
        id          : Id,
        inWallet    : inWallet,
        totalMinted : totalMinted,
        totalSupply : totalSupply,
      }
    );
  })
  .catch(err => {
    console.log("Error while retreiving dtscf2: "+err.message);

    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving dtscf."
    });
  });
}; // getInWalletMintedTotalSupply

// Retrieve all Dtscf from the database.
exports.findByName = async (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;  
  
  try {
    console.log("====== dtscf.findByName() ");

    const dtscfs = await Dtscf.findAll({
        where: condition,
        include: 
          [
            {
              model: db.recipients,
              as: 'anchor',
              attributes: ['name']
            },
            {
              model: db.campaigns,
              as: 'underlyingToken',
              attributes: ['tokenname']
            }
          ]
    });

    const formattedData = dtscfs.map(dtscf => {
      const json = dtscf.toJSON();
      json.anchorName = dtscf.anchor ? dtscf.anchor.name : null;
      json.tokenName = dtscf.underlyingToken ? dtscf.underlyingToken.tokenname : null;
      delete json.anchor;
      delete json.underlyingToken;
      return json;
    });

    logDataValues("Dtscf.findAll: ", formattedData);
    res.send(formattedData);
  } catch (err) {
    console.log("Error while retrieving findByName: "+err.message);
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving dtscf project records."
    });
  }
}; // findByName

exports.getAllByDtscfId = (req, res) => {
  const id = req.query.id;
  console.log("====== dtscf.getAllByDtscfId(id) ",id);
  var condition = id ? 
       {id : id}
      : null;

  Dtscf.findAll(
    { 
      where: condition,
      //include: db.recipients
      include: [
        {
          model: db.recipients,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("dtscfs.issuer"), "=", db.Sequelize.col("recipient.id")),
          },
          attributes: ['id','name'],
        },
        {
          model: db.campaigns,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("dtscfs.cashTokenID"), "=", db.Sequelize.col("campaign.id")),
          },
          attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
        }
      ]
    },
    )
    .then(data => {
      logDataValues("Dtscf.findAll: ", data);

      if (data.length === 0) {
        console.log("Data is empyty!!!");
        res.status(500).send({
          message: "No such record in the system" 
        });
      } else
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving dtscf5a: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving dtscf."
      });
    });
}; // getAllByDtscfId

// Retrieve all Dtscf from the database.
exports.getAll = async (req, res) => {
  try {
    console.log("====== dtscf.getAll() ");

    const dtscfs = await Dtscf.findAll({
    include: 
      [
        {
          model: db.recipients,
          as: 'anchor',
          attributes: ['name']
        },
        {
          model: db.campaigns,
          as: 'underlyingToken',
          attributes: ['tokenname']
        }
      ]
    });

    const formattedData = dtscfs.map(dtscf => {
      const json = dtscf.toJSON();
      json.anchorName = dtscf.anchor ? dtscf.anchor.name : null;
      json.tokenName = dtscf.underlyingToken ? dtscf.underlyingToken.tokenname : null;
      delete json.anchor;
      delete json.underlyingToken;
      return json;
    });

    logDataValues("Dtscf.findAll: ", formattedData);
    res.send(formattedData);
  } catch (err) {
    console.log("Error while retrieving dtscf4: "+err.message);
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving dtscf project records."
    });
  }
}; // getAll

exports.getAllDraftsByUserId = (req, res) => {
  const id = req.query.id;
  console.log("====== dtscf.getAllDraftsByUserId(id) ",id);
  var condition = id ? { 
        [Op.or]: 
        [
          { 
            [Op.and]: [
              {status: -1},  // rejected to maker inbox
              {maker : id},
            ]
          },
          { 
            [Op.and]: [
              {status: 0},  // created 
              {maker : id},
            ]
          },
          { 
            [Op.and]: [
              {status: 1},  // pending checker accept
              {checker : id},
            ]
          },
          { 
            [Op.and]: [
              {status: 2},  // pending approver accept
              {approver : id},
            ]
          },
        ],      
      } : null;

  Dtscf_Draft.findAll( 
    { 
      where: condition,
      //include: db.recipients
    },
    )
    .then(data => {
      logDataValues("Dtscf_Draft.findAll: ", data);
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving dtscf6: "+err.message);
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving dtscf."
      });
    }
  );
}; // getAllDraftsByUserId


exports.getAllDraftsByDtscfId = (req, res) => {
  const id = req.query.id;
  console.log("====== dtscf.getAllDraftsByDtscfId(id) ",id);
  if (!id) {
    console.log("ID is required for fetching drafts.");
    return res.status(400).send({ message: "ID is required" });
  }
  Dtscf_Draft.findByPk(id, {
      include: [
        {
          model: db.dtscf_milestones_draft,
          as: 'dtscf_milestones_drafts'  // Use the plural alias
        },
        {
          model: db.dtscf_contractors_draft,
          as: 'dtscf_contractors_drafts',
          include: [
            {
              model: db.dtscf_contractors_draft,
              as: 'subcontractors'
            },
            {
              model: db.dtscf_purchases_draft,
              as: 'dtscf_purchases_drafts'
            }
          ]
        }
      ]
    })
    .then(data => {
    if (data) {
      logDataValues("Dtscf_Draft.findByPk: ", data);
      res.send(data);
    } else {
      console.log("Cannot find Dtscf draft with id= ", id);
      res.status(404).send({
        message: `Cannot find Dtscf draft with id=${id}.`
      });
    }
  })
  .catch(err => {
    console.log("Error while retreiving dtscf draft: "+err.message);
    res.status(500).send({
      message: "Error retrieving Dtscf draft with id=" + id
    });
  });
}; // getAllDraftsByDtscfId

  // Find a single Dtscf with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Dtscf.findByPk(id, {
    include: db.recipients,
    include: db.campaigns,
  })
    .then(data => {
      if (data) {
        logDataValues("Dtscf.findByPk: ", data);
        res.send(data);
      } else {
        res.status(404).send({ 
          message: `Cannot find Dtscf with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Dtscf with id=" + id
      });
    });
}; // findOne

// Update a Dtscf by the id in the request
exports.update = async (req, res) => {
  var updatestatus = false;
  var errorSent = false;
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received3:");
  console.log("id=",id);
  console.log(req.body);

  ////////////////////////////// Blockchain ////////////////////////

  require('dotenv').config();
  const ETHEREUM_NETWORK = (() => {switch (req.body.campaign.blockchain) {
      case 80001:
        return process.env.REACT_APP_POLYGON_MUMBAI_NETWORK
      case 80002:
        return process.env.REACT_APP_POLYGON_AMOY_NETWORK
      case 11155111:
        return process.env.REACT_APP_ETHEREUM_SEPOLIA_NETWORK
      case 43113:
        return process.env.REACT_APP_AVALANCHE_FUJI_NETWORK
      case 137:
        return process.env.REACT_APP_POLYGON_MAINNET_NETWORK
      case 1:
        return process.env.REACT_APP_ETHEREUM_MAINNET_NETWORK
      case 43114:
        return process.env.REACT_APP_AVALANCHE_MAINNET_NETWORK
      default:
        return null
    }
  }
  )()

  if (!ETHEREUM_NETWORK) {
    if (!errorSent) {
      res.status(400).send({
        message: "Invalid blockchain network."
      });
      errorSent = true;
    }
    return;
  }

  const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
  const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
  const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;

  console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

  async function dAppUpdate() {

    updatestatus = false;

    // Readng ABI from JSON file
    fs = require("fs");
    ABI = JSON.parse(fs.readFileSync(abiFile).toString());

    // Creation of Web3 class
    Web3 = require("web3");

    // Setting up a HttpProvider
    web3 = new Web3( 
      Web3.providers.HttpProvider(
        `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
      ) 
    );
    //console.log("web3: =========>", web3);

    console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));
    // Creating a signing account from a private key
    const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY)
    // console.log("signer:", signer);  // contains private key

    // Update contract
    const UpdateContract = async () => {
      try {
        console.log('Creating contract with ABI');
        const tokenisedPayableContract = new web3.eth.Contract(ABI);

        // https://github.com/web3/web3.js/issues/1001
        web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );
        
        let setToTalSupply = (isNaN(+req.body.totalsupply)? req.body.totalsupply: req.body.totalsupply.toString())   
        + createStringWithZeros(adjustdecimals);  // pad zeros behind
        console.log("setToTalSupply = ", setToTalSupply);

        console.log('**** Signing update txn('+CONTRACT_OWNER_WALLET+','+req.body.totalsupply );
        const nonce = await web3.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest") //get latest nonce
        const createTransaction = await web3.eth.accounts.signTransaction(
          { // Sign transaction to setTotalSupply in smart contract
            nonce: nonce,
            from: signer.address,
            to: req.body.smartcontractaddress,
            data: tokenisedPayableContract.methods.updateTotalSupply(
                    1,  // dtscfId
                    web3.utils.toBN( setToTalSupply )
                  ).encodeABI(),
            gas: 8700000,  // 4700000,
          },
          SIGNER_PRIVATE_KEY
        ); // signTransaction
        console.log('**** Sending signed txn 3...');
        //console.log('Sending signed txn:', createTransaction);

        const createReceipt = await web3.eth.sendSignedTransaction(  // updateTotalSupply()
          createTransaction.rawTransaction, 
        
          function (error1, hash) {
            if (error1) {
                console.log("Error1111 when submitting your signed transaction:", error1);
                if (!errorSent) {
                  res.status(400).send({ 
                    message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
                  });
                  errorSent = true;
                }
            } else {
              console.log("Txn sent!, hash: ", hash);
              var timer = 1;
              // retry every second to chk for receipt
              const interval = setInterval(function() {
                console.log("Attempting E to get transaction receipt... ("+timer+")");

                // https://ethereum.stackexchange.com/questions/67232/how-to-wait-until-transaction-is-confirmed-web3-js
                web3.eth.getTransactionReceipt(hash, async function(error3, receipt) {
                  if (receipt) {
                    console.log('>> GOT RECEIPT!!!!!!!!!!!!!!!!!!!!!!!');
                    clearInterval(interval);
                    console.log('Receipt -->>: ', receipt);

                    const trx = await web3.eth.getTransaction(hash);
                    console.log('trx.status -->>: ',trx);

                    return(receipt.status);
                  }
                  if (error3) {
                    console.log("!! getTransactionReceipt error(6): ", error3)
                    clearInterval(interval);
                    return false;
                  }
                  if (timer > TIMEOUT) {
                    console.log("!! getTransactionReceipt error (6): timeout after "+TIMEOUT.toString()+" seconds");
                    clearInterval(interval);                      
                    console.log("Sending 22222 error 400 back to client");
                    if (!errorSent) {
                      res.status(400).send({ 
                        message: "Timeout after "+TIMEOUT.toString()+" seconds, please check the Dtscf tab after 5 minutes and try again if the Dtscf is not created.",
                      });
                      errorSent = true;
                    }
                    return false;
                  }
                });
                timer++;
              }, 1000);
            } // function
          })
          .on("error", err => {
              console.log("sentSignedTxn error: ", err)

              return false;
              // do something on transaction error
          }); // sendSignedTransaction

        console.log('**** Txn executed:', createReceipt);
        return true;
      } catch(error) {
        console.log('Error encountered -->: ',error)   

        return false;
      } // try

    }; // UpdateContract()

    return ( await UpdateContract());
  } // dAppUpdate

  updatestatus = null;
  //updatestatus = await dAppUpdate();
  console.log("exports.update Update status (3):", updatestatus);
  ////////////////////////////// Blockchain ////////////////////////

  if (updatestatus) {
    await Dtscf.update(
      {
        name                  : req.body.name,
        blockchain            : req.body.blockchain || 0, // Default or from form
        underlyingTokenID     : req.body.underlyingTokenID || null,
        underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
        campaign_id           : req.body.campaign_id || null,
        totalBudget           : req.body.totalBudget,

        startdate             : req.body.startdate, 
        enddate               : req.body.enddate,
      }, 
      { where:      { id: draft_id }},
      )
      .then(num => {
        if (num == 1) {

          // write to audit
          AuditTrail.create(
            { 
              action                : "Dtscf "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" update request - approved",
              name                  : req.body.name,
              totalBudget           : req.body.totalBudget,
              blockchain            : req.body.blockchain || 0, // Default or from form
              underlyingTokenID     : req.body.underlyingTokenID || null,
              underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
              campaign_id           : req.body.campaign_id || null,

              startdate             : req.body.startdate, 
              enddate               : req.body.enddate,
              
              txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

              draftdtscfId          : draft_id,
              maker                 : req.body.maker,
              checker               : req.body.checker,
              approver              : req.body.approver,
              actionby              : req.body.actionby,
              checkerComments       : req.body.checkerComments,
              approverComments      : req.body.approverComments,
              status                : 3,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
            }, 
          )
          .then(auditres => {
            console.log("Data written to audittrail for approving dtscf update request:", auditres);

          })
          .catch(err => {
            console.log("Error while logging to audittrail for approving dtscf update request: "+err.message);
          });

          if (!errorSent) {
            res.send({
              message: "Dtscf was updated successfully."
            });
            errorSent = true;
          }
        } else {
          if (!errorSent) {
            res.send({
              message: `${req.body}. Record updated =${num}. Cannot update Dtscf with id=${id}. Maybe Dtscf was not found or req.body is empty!`
            });
            errorSent = true;
          }
        }
      })
      .catch(err => {
        console.log(err);
        if (!errorSent) {
          res.status(500).send({
            message: `Error updating Dtscf. ${err}`
          });
          errorSent = true;
        }
      });
  } else {
    if (!errorSent) {
      res.status(500).send({
        message: "Error updating Dtscf. "
      });
      errorSent = true;
    }
  }
}; // update

// Delete a Dtscf with the specified id in the request
exports.approveDeleteDraftById = async (req, res) => {
  const draft_id = req.params.id;
  var msgSent = false;

  console.log("Received approveDeleteDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  // update draft table
  var Done = await Dtscf_Draft.update(  // update draft table status to "3"
  { 
    status            : 3,
    approverComments  : req.body.approvercomments,
  }, 
  { where:      { id: draft_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Dtscf "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - deleted",
          name                  : req.body.name,
          totalBudget           : req.body.totalBudget,
          blockchain            : req.body.blockchain || 0, // Default or from form
          underlyingTokenID     : req.body.underlyingTokenID || null,
          underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
          campaign_id           : req.body.campaign_id || null,

          startdate             : req.body.startdate, 
          enddate               : req.body.enddate,
          
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          status                : 3,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for dtscf delete request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for dtscf delete request: "+err.message);
      });
    
    }
    return true;
  })
  .catch(err => {
    console.log(err);
    if (!msgSent) {
      console.log("Sending error 400 back to client");
      res.status(400).send({ 
        message: 'Error when updating database, please inform tech support.',
      });
      msgSent = true;
    }
    return false;
  });

  if (Done) await Dtscf.destroy({ // delete entry in approved Dtscf table
    where: { id: req.body.approveddtscfid }
  })
  .then(num => {
    if (num == 1) {
      if (!msgSent) {
        console.log("Sending success dtscf delete to client");
        res.send({
          message: "Dtscf was deleted successfully!"
        });
        msgSent = true;
      }
      return true;
    } else {
      if (!msgSent) {
        res.send({
          message: `Cannot delete Dtscf with id=${req.body.approveddtscfid}. Maybe Dtscf was not found!`
        });
        msgSent = true;
      }
      return true;
    }
  })
  .catch(err => {
    if (!msgSent) {
      console.log("Sending error 400 back to client");
      res.status(400).send({ 
        message: 'Error when deleting Dtscf from database, please inform tech support.',
      });
      msgSent = true;
    }
    return false;
  });    
}; // approveDeleteDraftById

exports.dropRequestById = async (req, res) => {
  const draft_id = req.params.id;
  var msgSent = false;

  console.log("Received dropRequestById:");
  console.log("id=",req.params.id);
  console.log(req.body);

  // update draft table
  await Dtscf_Draft.update(  // update draft table status to "9" - aborted / dropped requests
  { 
    status            : 9,
    approverComments  : req.body.approvercomments,
  }, 
  { where:      { id: draft_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Dtscf "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - dropped",
          name                  : req.body.name,
          totalBudget           : req.body.totalBudget,
          blockchain            : req.body.blockchain || 0, // Default or from form
          underlyingTokenID     : req.body.underlyingTokenID || null,
          underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
          campaign_id           : req.body.campaign_id || null,

          startdate             : req.body.startdate, 
          enddate               : req.body.enddate,
          
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          status                : 9,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for dropping dtscf request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for dropping dtscf request: "+err.message);
      });
      
      if (!msgSent) {
        console.log("Sending success dtscf request dropped to client");
        res.send({
          message: "Request droppped(deleted) successfully!"
        });
        msgSent = true;
      }
      return true;
    } else {
    }
    return true;
  })
  .catch(err => {
    console.log(err);
    if (!msgSent) {
      console.log("Sending error 400 back to client");
      res.status(400).send({ 
        message: "Error when dropping request, please try again.",
      });
      msgSent = true;
    }
    return false;
  });  
}; // dropRequestById

// Delete a Dtscf with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  var errorSent = false;

  console.log(req.body.actionby);

  Dtscf.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        if (!errorSent) {
          res.send({
            message: "Dtscf was deleted successfully!"
          });
          errorSent = true;
        }
      } else {
        if (!errorSent) {
          res.send({
            message: `Cannot delete Dtscf with id=${id}. Maybe Dtscf was not found!`
          });
          errorSent = true;
        }
      }
    })
    .catch(err => {
      if (!errorSent) {
        res.status(500).send({
          message: "Could not delete Dtscf with id=" + id
        });
        errorSent = true;
      }
    });
}; // delete

// Delete all Dtscf from the database.
exports.deleteAll = (req, res) => {
  var errorSent = false;

  Dtscf.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Dtscf were deleted successfully!` });
    })
    .catch(err => {
      if (!errorSent) {
        res.status(500).send({
          message:
            err.message || "Some error occurred while removing all dtscf."
        });
        errorSent = true;
      }
    });
}; // deleteAll

/*
// Get draft by id with nested structure
exports.getAllDraftsByDtscfId = async (req, res) => {
  const id = req.params.id;
  if (!id) {
    console.log("ID is required for fetching drafts.");
    return res.status(400).send({ message: "ID is required" });
  }

  Dtscf_Draft.findByPk(id, {
    include: [
      { model: db.dtscf_milestones_draft, as: 'dtscf_milestones_drafts' },
      { model: db.dtscf_contractors_draft, as: 'dtscf_contractors_drafts', where: { dtscf_parent_contractor_id: null }, include: [
        { model: db.dtscf_purchases_draft, as: 'dtscf_purchases_drafts' },
        { model: db.dtscf_contractors_draft, as: 'subcontractors', include: [
          { model: db.dtscf_purchases_draft, as: 'dtscf_purchases_drafts' }
        ] }
      ] }
    ]
  })
  .then(data => {
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving the Dtscf."
    });
  });
};
*/
