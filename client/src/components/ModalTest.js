import React, { useState } from 'react';
import Modal from '../Modal.js'; // Ensure path matches your project structure[cite: 1]

const ModalTest = () => {
  const [showModal, setShowModal] = useState(false);

  // Generating a long text string (approx 20 lines) to test scrolling
  const longText = Array.from({ length: 5 }, (_, i) => 
    `Line ${i + 1}: This is a test line to verify that the modal correctly limits height and allows scrolling.`
  ).join('\n');

  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  const handleProceed = () => {
    console.log("Proceed action triggered");
    handleClose();
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h2>Modal Scroll Test Page</h2>
      <p>Click the button below to test the 10-line limit and scrolling behavior.</p>
      
      <button 
        className="btn btn-primary" 
        onClick={handleOpen}
      >
        Open Scrollable Modal
      </button>

      {/* 
          Passing props to Modal as defined in Modal.js:
          showm, children, button0text, handleCancel
      */}
      <Modal 
        showm={showModal} 
        handleCancel={handleClose}
        handleProceed1={handleProceed}
        button1text="Confirm"
        button0text="Close"
      >
        {longText}
      </Modal>
    </div>
  );
};

export default ModalTest;