import React from 'react';

const DesignStandardsExample: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1>Design Standards Example</h1>
      
      {/* Card Examples */}
      <div className="card">
        <h2>Standard Card</h2>
        <p>This is a standard card with the default padding and shadow.</p>
      </div>
      
      <div className="card-compact">
        <h2>Compact Card</h2>
        <p>This is a compact card with reduced padding and shadow.</p>
      </div>
      
      <div className="card-minimal">
        <h2>Minimal Card</h2>
        <p>This is a minimal card with minimal padding and shadow.</p>
      </div>
      
      {/* Form Examples */}
      <div className="card">
        <h2>Form Elements</h2>
        
        <div className="form-group">
          <label htmlFor="example-text">Text Input</label>
          <input 
            type="text" 
            id="example-text" 
            placeholder="Enter text here"
            style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="example-email">Email Input</label>
          <input 
            type="email" 
            id="example-email" 
            placeholder="Enter email here"
            style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="example-select">Select Dropdown</label>
          <select 
            id="example-select"
            style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
          >
            <option value="">Choose an option</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="example-textarea">Textarea</label>
          <textarea 
            id="example-textarea" 
            placeholder="Enter longer text here"
            style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="first-name">First Name</label>
            <input 
              type="text" 
              id="first-name" 
              placeholder="First name"
              style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="last-name">Last Name</label>
            <input 
              type="text" 
              id="last-name" 
              placeholder="Last name"
              style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
            />
          </div>
        </div>
        
        <div className="helper-text">
          This is helper text that provides additional information about the form.
        </div>
        
        <div className="helper-text-compact">
          This is compact helper text for shorter explanations.
        </div>
      </div>
      
      {/* Button Examples */}
      <div className="card">
        <h2>Button Variants</h2>
        
        <div className="form-group">
          <button className="btn-primary btn-capsule w-full">
            Primary Button
          </button>
        </div>
        
        <div className="form-group">
          <button className="btn-secondary btn-capsule w-full">
            Secondary Button
          </button>
        </div>
        
        <div className="form-row">
          <button className="btn-primary btn-capsule">
            Primary
          </button>
          <button className="btn-secondary btn-capsule">
            Secondary
          </button>
        </div>
      </div>
      
      {/* Typography Examples */}
      <div className="card">
        <h2>Typography</h2>
        
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
        <h5>Heading 5</h5>
        <h6>Heading 6</h6>
        
        <p>This is a regular paragraph with normal text styling.</p>
        
        <div className="helper-text">
          This is helper text that provides additional context or instructions.
        </div>
      </div>
      
      {/* Spacing Examples */}
      <div className="card">
        <h2>Spacing Utilities</h2>
        
        <div className="margin-standard bg-gray-100 p-4 rounded">
          Standard margin (2rem)
        </div>
        
        <div className="margin-compact bg-gray-100 p-4 rounded">
          Compact margin (1rem)
        </div>
        
        <div className="margin-minimal bg-gray-100 p-4 rounded">
          Minimal margin (0.5rem)
        </div>
      </div>
    </div>
  );
};

export default DesignStandardsExample;
