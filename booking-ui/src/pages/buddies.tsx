import React from 'react';
import { Ajax, Buddy, User, Formatting } from 'flexspace-commons';
import Loading from '../components/Loading';
import { Button, Form, ListGroup, Modal } from 'react-bootstrap';
import { LogIn as IconEnter, LogOut as IconLeave, MapPin as IconLocation } from 'react-feather';
import { WithTranslation, withTranslation } from 'next-i18next';
import { NextRouter } from 'next/router';
import NavBar from '@/components/NavBar';
import withReadyRouter from '@/components/withReadyRouter';
import RuntimeConfig from '@/components/RuntimeConfig';

interface State {
  loading: boolean
  selectedItem: Buddy | null
  email: string
}

interface Props extends WithTranslation {
  router: NextRouter
}

class Buddies extends React.Component<Props, State> {
  data: Buddy[];

  constructor(props: any) {
    super(props);
    this.data = [];
    this.state = {
      loading: true,
      selectedItem: null,
      email: ''
    };
  }

  componentDidMount = () => {
    if (!Ajax.CREDENTIALS.accessToken) {
      this.props.router.push("/login");
      return;
    }
    this.loadData();
  }

  loadData = () => {
    Buddy.list().then(list => {
      this.data = list;
      this.setState({ loading: false });
    });
  }

  onItemPress = (item: Buddy) => {
    this.setState({ selectedItem: item });
  }

  removeBuddy = (item: Buddy | null) => {
    this.setState({
      loading: true
    });
    this.state.selectedItem?.delete().then(() => {
      this.setState({
        selectedItem: null,
      }, this.loadData);
    });
  }

  addBuddy = () => {
    const { email } = this.state;

    if (!email) {
      return;
    }

    if (this.data.find(item => item.buddy.email === email)) {
      return;
    }

    const addBuddyByEmail = new User().getByEmail(email).then((user: User) => {
      const buddy = new Buddy();
      buddy.buddy = user;
      buddy.save().then(() => {
        this.setState({ email: '' });
        this.loadData()
      });
    });
  };

  renderAddBuddy() {
    return (
      <Form.Group className='grid-item'>
        <Form.Control
          type="email"
          placeholder="Email..."
          value={this.state.email}
          onChange={(e) => this.setState({ email: e.target.value })}
          style={{ marginBottom: '10px', padding: '10px' }}
        />
        <Button
          variant="primary"
          onClick={(e) => { e.preventDefault(); this.addBuddy() }}
          style={{ backgroundColor: '#007bff', borderColor: '#007bff', color: 'white' }}
        >
          {this.props.t("addBuddy")}
        </Button>
      </Form.Group>
    );
  }

  renderItem = ({ id, buddy: {email, firstBooking} }: Buddy) => {
    let formatter = Formatting.getFormatter();
    if (RuntimeConfig.INFOS.dailyBasisBooking) {
      formatter = Formatting.getFormatterNoTime();
    }
    return (
      <ListGroup.Item key={id} style={{minWidth: "300px"}}>
        <h5>{email}</h5>
        <p>
          <IconLocation className="feather" />&nbsp;{firstBooking!.room}, {firstBooking!.desk}<br />
          <IconEnter className="feather" />&nbsp;{formatter.format(new Date(firstBooking!.enter))}<br />
          <IconLeave className="feather" />&nbsp;{formatter.format(new Date(firstBooking!.leave))}
        </p>
      </ListGroup.Item>
    );
  }

  render() {
    if (this.state.loading) {
      return <Loading />;
    }
    if (this.data.length === 0) {
      return (
        <>
          <NavBar />
          <div className="container-signin">
            <Form className="form-signin">
              <p>{this.props.t("noBuddies")}</p>
              {this.renderAddBuddy()}
            </Form>
          </div>
        </>
      );
    }
    return (
      <>
        <NavBar />
        <div className="container-signin">
          <Form className="form-signin">
            <div className='grid-container'>
              <ListGroup>
                {this.data.map(item => this.renderItem(item))}
              </ListGroup>
              {this.renderAddBuddy()}
            </div>
          </Form>
        </div>
        <Modal show={this.state.selectedItem != null} onHide={() => this.setState({ selectedItem: null })}>
          <Modal.Header closeButton>
            <Modal.Title>{this.props.t("removeBuddy")}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{this.props.t("confirmRemoveBuddy", { interpolation: { escapeValue: false } })}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => this.setState({ selectedItem: null })}>
              {this.props.t("back")}
            </Button>
            <Button variant="danger" onClick={() => this.removeBuddy(this.state.selectedItem)}>
              {this.props.t("removeBuddy")}
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}

export default withTranslation()(withReadyRouter(Buddies as any));
