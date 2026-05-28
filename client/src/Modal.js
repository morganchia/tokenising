// https://www.digitalocean.com/community/tutorials/react-modal-component
import { useRef, useLayoutEffect, useState } from 'react';
import './modal.css';

const Modal = ({ handleProceed1, handleProceed2, handleProceed3, handleCancel, button1text, button2text, button3text, button0text, showm, children }) => {
  const showHideClassName = showm ? "modal display-block" : "modal display-none";
  const contentRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const overflows = el.scrollHeight > el.clientHeight;
    setIsOverflowing(overflows);
    if (overflows) {
      el.scrollTop = el.scrollHeight;
    }
  }, [children, showm]);

  var myarr = children;
  if (typeof children === 'string' || children instanceof String) {
    myarr = children.split('\n');
  }

  return (
    <center><div className={showHideClassName}>
      <section className="modal-main">
        <div
          ref={contentRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isOverflowing ? 'flex-start' : 'center',
          }}
        >
          {(typeof children === 'string' || children instanceof String)
            ? myarr.map((data1, index) => <p key={index} style={{ fontSize: '1rem', marginBottom: '4px' }}>{data1}</p>)
            : children
          }
        </div>
        <div style={{ flexShrink: 0, minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        </div>
      </section>
    </div>
    </center>
  );
};

export default Modal;
