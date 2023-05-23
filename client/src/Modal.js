// https://www.digitalocean.com/community/tutorials/react-modal-component
import './modal.css';

const Modal = ({ handleProceed1, handleProceed2, handleProceed3, handleCancel, button1text, button2text, button3text, button0text, showm, children }) => {
  const showHideClassName = showm ? "modal display-block" : "modal display-none";
  var myarr = children;

  if (typeof children === 'string' || children instanceof String) {
    myarr = children.split('\n');
  } 
  //console.log("children:", children);
  //console.log("myarr:", myarr);

  return (
    <center><div className={showHideClassName}>
      <section className="modal-main">
        <br />
        { (typeof children === 'string' || children instanceof String) ? myarr.map((data1)=>{
          return <p>{data1}</p>
        }) 
        : children
        }
        { button1text?  
        <button className="m-3 btn btn-sm btn-warning" onClick={() => {handleCancel(); handleProceed1(); }}>
          {button1text}
        </button> 
        : null}

        { button2text?  
        <button className="m-3 btn btn-sm btn-warning" onClick={() => {handleCancel(); handleProceed2(); }}>
          {button2text}
        </button> 
        : null}

        { button3text?  
        <button className="m-3 btn btn-sm btn-warning" onClick={() => {handleCancel(); handleProceed3(); }}>
          {button3text}
        </button> 
        : null}

         { button0text?  
        <button className="m-3 btn btn-sm btn-secondary" onClick={ handleCancel }>
          {button0text}
        </button>
        : null}
      </section>
    </div>
    </center>
  );
};

export default Modal;