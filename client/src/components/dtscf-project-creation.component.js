// dtscf-project-creation.component.js
import React, { Component } from "react";
import DTSCFDataService from "../services/dtscf.service";
import { withRouter } from '../common/with-router';
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";
import moment from 'moment';

function getToday() {
  const today = new Date();
  return moment(today).format('YYYY-MM-DD')
}

class DTSCFProjectCreation extends Component {
  constructor(props) {
    super(props);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeTotalBudget = this.onChangeTotalBudget.bind(this);
    this.addMilestone = this.addMilestone.bind(this);
    this.onChangeMilestone = this.onChangeMilestone.bind(this);
    this.removeMilestone = this.removeMilestone.bind(this);
    this.addContractor = this.addContractor.bind(this);
    this.onChangeContractor = this.onChangeContractor.bind(this);
    this.removeContractor = this.removeContractor.bind(this);
    this.addPurchase = this.addPurchase.bind(this);
    this.onChangePurchase = this.onChangePurchase.bind(this);
    this.removePurchase = this.removePurchase.bind(this);
    this.handleInvoiceUpload = this.handleInvoiceUpload.bind(this);
    this.createProject = this.createProject.bind(this);
    this.updateProject = this.updateProject.bind(this);
    this.showModal_Leave = this.showModal_Leave.bind(this);
    this.hideModal = this.hideModal.bind(this);

    this.state = {
      currentProject: {
        id: 0,
        description: "",
        totalBudget: 0,
        milestones: [], // [{description: "", budget: 0}]
        contractors: [], // [{name: "", budget: 0, purchases: [{description: ""}], invoices: []}] // invoices as File objects
      },
      isNewProject: true,
      datachanged: false,
      message: "",
      isLoading: false,
      modal: {
        showm: false,
        modalmsg: "",
        button1text: null,
        button0text: null,
      }
    };
  }

  componentDidMount() {
    const { id } = this.props.router.params;
    if (id !== "0") {
      this.setState({ isNewProject: false });
      this.getProject(id);
    }
  }

  getProject(id) {
    this.setState({ isLoading: true });
    DTSCFDataService.get(id)
      .then(response => {
        this.setState({
          currentProject: response.data,
          isLoading: false
        });
      })
      .catch(e => {
        console.log(e);
        this.setState({ isLoading: false });
      });
  }

  onChangeDescription(e) {
    const description = e.target.value;
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, description },
      datachanged: true
    }));
  }

  onChangeTotalBudget(e) {
    const totalBudget = parseFloat(e.target.value);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, totalBudget },
      datachanged: true
    }));
  }

  addMilestone() {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        milestones: [...prevState.currentProject.milestones, { description: "", budget: 0 }]
      },
      datachanged: true
    }));
  }

  onChangeMilestone(index, field, value) {
    const milestones = [...this.state.currentProject.milestones];
    milestones[index][field] = field === 'budget' ? parseFloat(value) : value;
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, milestones },
      datachanged: true
    }));
  }

  removeMilestone(index) {
    const milestones = [...this.state.currentProject.milestones];
    milestones.splice(index, 1);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, milestones },
      datachanged: true
    }));
  }

  addContractor() {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: [...prevState.currentProject.contractors, { name: "", budget: 0, purchases: [], invoices: [] }]
      },
      datachanged: true
    }));
  }

  onChangeContractor(index, field, value) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[index][field] = field === 'budget' ? parseFloat(value) : value;
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  removeContractor(index) {
    const contractors = [...this.state.currentProject.contractors];
    contractors.splice(index, 1);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  addPurchase(conIndex) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[conIndex].purchases.push({ description: "" });
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  onChangePurchase(conIndex, purIndex, value) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[conIndex].purchases[purIndex].description = value;
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  removePurchase(conIndex, purIndex) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[conIndex].purchases.splice(purIndex, 1);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  handleInvoiceUpload(conIndex, e) {
    const file = e.target.files[0];
    const contractors = [...this.state.currentProject.contractors];
    contractors[conIndex].invoices.push(file);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  createProject() {
    this.setState({ isLoading: true });
    const formData = new FormData();
    formData.append('description', this.state.currentProject.description);
    formData.append('totalBudget', this.state.currentProject.totalBudget);
    formData.append('milestones', JSON.stringify(this.state.currentProject.milestones));
    formData.append('contractors', JSON.stringify(this.state.currentProject.contractors.map(c => ({...c, invoices: []})))); // Send metadata

    this.state.currentProject.contractors.forEach((con, conIndex) => {
      con.invoices.forEach((inv, invIndex) => {
        formData.append(`contractor_${conIndex}_invoice_${invIndex}`, inv);
      });
    });

    DTSCFDataService.create(formData)
      .then(response => {
        this.setState({ message: "Project created successfully!", isLoading: false });
      })
      .catch(e => {
        console.log(e);
        this.setState({ isLoading: false });
      });
  }

  updateProject() {
    this.setState({ isLoading: true });
    const formData = new FormData();
    formData.append('id', this.state.currentProject.id);
    // Similar to create, append all data

    DTSCFDataService.update(this.state.currentProject.id, formData)
      .then(response => {
        this.setState({ message: "Project updated successfully!", isLoading: false });
      })
      .catch(e => {
        console.log(e);
        this.setState({ isLoading: false });
      });
  }

  // Modal functions similar to bond

  render() {
    const { currentProject, isNewProject, isLoading } = this.state;

    return (
      <div className="container">
        {isLoading ? <LoadingSpinner /> : null}
        <form>
          <div className="form-group">
            <label htmlFor="description">Project Description</label>
            <input type="text" className="form-control" id="description" value={currentProject.description} onChange={this.onChangeDescription} />
          </div>
          <div className="form-group">
            <label htmlFor="totalBudget">Total Budget</label>
            <input type="number" className="form-control" id="totalBudget" value={currentProject.totalBudget} onChange={this.onChangeTotalBudget} />
          </div>

          <h4>Milestones</h4>
          {currentProject.milestones.map((milestone, index) => (
            <div key={index}>
              <input type="text" value={milestone.description} onChange={(e) => this.onChangeMilestone(index, 'description', e.target.value)} placeholder="Description" />
              <input type="number" value={milestone.budget} onChange={(e) => this.onChangeMilestone(index, 'budget', e.target.value)} placeholder="Budget" />
              <button type="button" onClick={() => this.removeMilestone(index)}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={this.addMilestone}>Add Milestone</button>

          <h4>Tier-1 Contractors</h4>
          {currentProject.contractors.map((contractor, conIndex) => (
            <div key={conIndex}>
              <input type="text" value={contractor.name} onChange={(e) => this.onChangeContractor(conIndex, 'name', e.target.value)} placeholder="Name" />
              <input type="number" value={contractor.budget} onChange={(e) => this.onChangeContractor(conIndex, 'budget', e.target.value)} placeholder="Budget" />
              <h5>Purchases</h5>
              {contractor.purchases.map((purchase, purIndex) => (
                <div key={purIndex}>
                  <input type="text" value={purchase.description} onChange={(e) => this.onChangePurchase(conIndex, purIndex, e.target.value)} placeholder="Purchase Description" />
                  <button type="button" onClick={() => this.removePurchase(conIndex, purIndex)}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => this.addPurchase(conIndex)}>Add Purchase</button>
              <h5>Invoices</h5>
              {contractor.invoices.map((inv, invIndex) => (
                <div key={invIndex}>{inv.name}</div>
              ))}
              <input type="file" onChange={(e) => this.handleInvoiceUpload(conIndex, e)} />
              <button type="button" onClick={() => this.removeContractor(conIndex)}>Remove Contractor</button>
            </div>
          ))}
          <button type="button" onClick={this.addContractor}>Add Contractor</button>
        </form>

        {isNewProject ? (
          <button onClick={this.createProject} className="m-3 btn btn-sm btn-primary">Create Project</button>
        ) : (
          <button onClick={this.updateProject} className="m-3 btn btn-sm btn-primary">Update Project</button>
        )}

        <p>{this.state.message}</p>
        {/* Modal for leave, etc. */}
      </div>
    );
  }
}

export default withRouter(DTSCFProjectCreation);