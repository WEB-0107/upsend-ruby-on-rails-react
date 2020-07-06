import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import styled from "@emotion/styled";
import { InlineFilterDialog, SaveSegmentModal } from "./index";
import RadioButtonCheckedIcon from "@material-ui/icons/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import Map from "../map/index.js";
import { dispatchSegmentUpdate } from "../../actions/segments";
import { setCurrentSection, setCurrentPage } from "../../actions/navigation";
import CircularProgress from "@material-ui/core/CircularProgress";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import SegmentItemButton from "../segmentManager/itemButton";
import NewUserOrLead from "../segmentManager/newUserOrLead"; 

import Checkbox from "@material-ui/core/Checkbox";
import Avatar from "@material-ui/core/Avatar";
import Input from "@material-ui/core/Input";

import {isEmpty} from 'lodash'
import graphql from '../../graphql/client'
import { Datatable, IconColName } from "../../components/datatable/";
import { green } from '@material-ui/core/colors';

import icon_face from "../../icons/bxs-face.svg";
import icon_email from "../../icons/bxs-envelope.svg";
import icon_state from "../../icons/bx-check.svg";
import icon_phone from "../../icons/bxs-phone.svg";
import icon_calc from "../../icons/bxs-calendar.svg";
import icon_map from "../../icons/bxs-map-alt.svg";
import icon_msg from "../../icons/bxs-message-square-detail.svg";
import icon_col from "../../icons/bx-columns.svg";
import icon_type from "../../icons/bxs-user-detail.svg";
import icon_owner from "../../icons/bxs-lock.svg";
import icon_conversation from "../../icons/bxs-conversation.svg";
import icon_id from "../../icons/bxs-id-card.svg";
import icon_downArrow from "../../../../assets/images/bxs-down-arrow.svg";
import icon_users from "../../../../assets/images/friends.svg";
import icon_save from "../../icons/bx-save.svg";

import {errorMessage, successMessage} from '../../actions/status_messages'
import { CREATE_NEW_USER, CREATE_NEW_LEAD, UPDATE_SEGMENET } from '../../graphql/mutations'

import ExportUsers from './exportUsers'
import ArchiveUsers from './archiveUsers'

import Moment from 'react-moment';
import 'moment-timezone';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position:relative;
`;

const ButtonGroup = styled.div`
  display: inline-flex;
  justify-content: space-between;
  flex-wrap: wrap;
  width: 100%;
  padding-top: 1em;
  padding-bottom: 1em;
  border-top: solid 1px rgba(0, 0, 0, 0.12);
  border-bottom: solid 1px rgba(0, 0, 0, 0.12);
  margin-bottom: 1em;
  button {
    margin-right: 5px !important;
    margin: 2px;
    position:relative;
  }
`;

const ButtonGroup1 = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  width: 100%;
  padding-top: 1em;
  padding-bottom: 1em;
  position:relative;
`;
const MuiToolbarRegular = styled.div`
  min-height: 0;
`;

class AppContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openNewLead: false,
      openNewUser: false,
      openImportContact: false
    };
    this.getSegment = this.getSegment.bind(this);
  }

  componentDidMount() {
    this.props.dispatch(setCurrentSection("Platform"));

    this.props.dispatch(
      setCurrentPage(`segment-${this.props.match.params.segmentID}`)
    );

    this.props.dispatch(
      dispatchSegmentUpdate({
        id: this.props.match.params.segmentID,
        jwt: this.props.match.params.Jwt,
      })
    );

    this.getSegment(() => {
      this.props.actions.search();
    });
  }

  getSegment() {
    const segmentID = this.props.match.params.segmentID;
    segmentID ? this.props.actions.fetchAppSegment(segmentID) : null;
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.match.params &&
      prevProps.match.params.segmentID !== this.props.match.params.segmentID
    ) {
      this.props.dispatch(
        dispatchSegmentUpdate({
          id: this.props.match.params.segmentID,
          jwt: this.props.match.params.Jwt,
        })
      );

      this.props.dispatch(
        setCurrentPage(`segment-${this.props.match.params.segmentID}`)
      );

      this.getSegment(() => {
        this.props.actions.search();
      });
    }

    if (
      prevProps.segment.jwt &&
      prevProps.segment.jwt !== this.props.segment.jwt
    ) {
      //console.info("cambio jwt")
      this.props.actions.search();
    }

    // check empty token , used when same sagment changes jwt
    if (
      prevProps.match.params.Jwt !== this.props.match.params.Jwt &&
      !this.props.match.params.Jwt
    ) {
      this.props.dispatch(
        dispatchSegmentUpdate({
          jwt: this.props.match.params.Jwt,
        })
      );

      this.getSegment(() => {
        this.props.actions.search();
      });
    }
  }

  render() {
    const { searching, collection, meta } = this.props.app_users;
    return (
      <div>
        {this.props.app.key && this.props.segment && this.props.segment.id ? (
          <AppUsers
            actions={this.props.actions}
            history={this.props.history}
            dispatch={this.props.dispatch}
            app={this.props.app}
            segment={this.props.segment}
            app_users={collection}
            app_user={this.props.app_user}
            meta={meta}
            searching={searching}
            openNewLead={this.state.openNewLead}
            openNewUser={this.state.openNewUser}
            openImportContact={this.state.openImportContact}
            handleCloseNewUserOpen={() => this.setState({ openNewUser: false })}
            handleCloseNewLeadOpen={() => this.setState({ openNewLead: false })}
            handleCloseImportContact={() => this.setState({ openImportContact: false })}
            handleNewUserOpen={() => this.setState({ openNewUser: true })}
            handleNewLeadOpen={() => this.setState({ openNewLead: true })}
            handleImportContact={() => this.setState({ openImportContact: true })}
          />
        ) : null}
      </div>
    );
  }
}

class AppUsers extends Component {
  constructor(props) {
    super(props);
    this.state = {
      map_view: false,
      rightDrawer: false,
      app_users: props.app_users,
      selected_users: [],
      visible_cols: [
        "displayName",
        "type",
        "email",
        "phone",
        "id",
        "firstSeen",
        "lastSeen",
      ],
      allSelected: false
    };
    this.toggleMap = this.toggleMap.bind(this);
    this.toggleList = this.toggleList.bind(this);
  }

  toggleMap = (e) => {
    this.setState({ map_view: false });
  };

  toggleList = (e) => {
    this.setState({ map_view: true });
  };

  toggleMapView = (e) => {
    this.setState({ map_view: !this.state.map_view });
  };

  handleClickOnSelectedFilter = (jwtToken) => {
    const url = `/apps/${this.props.app.key}/segments/${this.props.segment.id}/${jwtToken}`;
    this.props.history.push(url);
  };

  displayName = (o) => {
    return o.attribute.split("_").join(" ");
  };

  getTextForPredicate = (o) => {
    if (o.type === "match") {
      return `Match ${o.value === "and" ? "all" : "any"} criteria`;
    } else {
      return `${this.displayName(o)} ${o.comparison ? o.comparison : ""} ${
        o.value ? o.value : ""
      }`;
    }
  };

  getStatePredicate = () => {
    return this.props.actions
      .getPredicates()
      .find((o) => o.attribute === "subscription_state");
  };



  saveSegment(vc){ 

    graphql(
      UPDATE_SEGMENET,
      {
        id: this.props.segment.id,
        appKey: this.props.app.key,
        segmentParams: {
          config_table_columns: vc,
        },
      },
      {
        success: (data) => {
          console.log("success", data);

          // this.setState({
          //   data: data.campaignUpdate.campaign,
          // });
          // this.props.dispatch(successMessage("campaign updated"));
        },
        error: (data) => {
          console.log("error", data);
          //this.props.dispatch(errorMessage("error updating campaign"));
        },
      }
    );

  }

  handleToggleColumnVisible(v) { 
    const vc = this.getVisibleColumns();
    let i = vc.indexOf(v);
    if (i === -1) vc.push(v);
    else vc.splice(i, 1);
    this.setState({
      visible_cols: vc,
    });
    this.saveSegment(vc)
  }

  getVisibleColumns() {
    return (this.props.segment && this.props.segment.configTableColumns) ? this.props.segment.configTableColumns : this.state.visible_cols
  }

  caption = (visible_cols) => {
    return (
      <ButtonGroup>
        <div style={{ display: "inline-flex" }}>
          { this.props.actions
            .getPredicates()
            .map((o, i) => {
              return (
                <SegmentItemButton
                  key={`segment-item-button-${i}`}
                  index={i}
                  predicate={o}
                  predicates={this.props.actions.getPredicates()}
                  open={!o.comparison}
                  appearance={o.comparison ? "primary" : "default"}
                  text={this.getTextForPredicate(o)}
                  updatePredicate={this.props.actions.updatePredicate}
                  predicateCallback={(jwtToken) =>
                    this.handleClickOnSelectedFilter.bind(this)(jwtToken)
                  }
                  deletePredicate={this.props.actions.deletePredicate}
                />
              );
            })}

          <InlineFilterDialog
            {...this.props}
            handleClick={this.handleClickOnSelectedFilter.bind(this)}
            addPredicate={this.props.actions.addPredicate}
          />

          <SaveSegmentModal
            title="Save Segment"
            segment={this.props.segment}
            savePredicates={this.props.actions.savePredicates}
            predicateCallback={() => {
              const url = `/apps/${this.props.app.key}/segments/${this.props.segment.id}`;
              this.props.history.push(url);
            }}
            deleteSegment={this.props.actions.deleteSegment}
          />
          <EditColumnList
            visible_cols={visible_cols}
            options={userFormat(this.showUserDrawer, this.props.app)}
            onChange={(v) => this.handleToggleColumnVisible(v)}
          />
        </div>
   
      </ButtonGroup>
    );
  };

  showUserDrawer = (o) => {
    this.props.actions.showUserDrawer(o.id);
  };

  getUserData = (id) => {
    this.props.actions.setAppUser(id);
  };

  handleUserSubmit = (name, email) => {
    const options = {}
    options["name"] = name
    options["email"] = email
    graphql(CREATE_NEW_USER, {
      appKey: this.props.app.key, 
      options: options
    }, {
      success: (data)=>{
        if(isEmpty(data.createAppUser.errors)){
          dispatch(successMessage("New User Created"))
        }
        else{
          dispatch(errorMessage(data.createAppUser.errors[0]))
        }
      },
      error: (error)=>{
        console.log("ERRR Creating User", error)
      }
    })  
    this.props.handleCloseNewUserOpen()
    window.location.reload(); 
  }

  handleLeadSubmit = (name, email) => {
    const options = {}
    options["name"] = name
    options["email"] = email
    graphql(CREATE_NEW_LEAD, {
      appKey: this.props.app.key, 
      options: options
    }, {
      success: (data)=>{
        if(isEmpty(data.createNewLead.errors)){
          dispatch(successMessage("New Lead Created"))
        }
        else{
          dispatch(errorMessage(data.createNewLead.errors[0]))
        }
      },
      error: (error)=>{
        console.log("ERRR Creating Lead", error)
      }
    })
    this.props.handleCloseNewLeadOpen()
    window.location.reload(); 
  }
 
  render() {
    const visible_cols = this.props.segment.configTableColumns || this.state.visible_cols;
    const columns = [
      {
        name: <IconColName icon={icon_face}>Name</IconColName>,
        selector: "displayName",
        sortable: true,
        width: "160px",
        grow: 2,
        omit: visible_cols.indexOf("displayName") === -1,
        cell: (row) => (
          <>
            <Avatar
              alt="Remy Sharp"
              src={row.avatarUrl}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer'
              }}
              onClick={() => this.showUserDrawer(row)}
            />
            &nbsp;
            <a href="#" onClick={() => this.showUserDrawer(row)} style={{ color: '#000' }}>{row.displayName}</a>
          </>
        ),
      },
      {
        name: <IconColName icon={icon_type}>Type</IconColName>,
        selector: "type",
        sortable: true,
        width: "100px",
        grow: 2,
        omit: visible_cols.indexOf("type") === -1,
        cell: (row) => "User",
      },
      {
        name: <IconColName icon={icon_owner}>Owner</IconColName>,
        selector: "owner",
        sortable: true,
        width: "110px",
        grow: 2,
        omit: visible_cols.indexOf("owner") === -1,
        cell: (row) =>
          typeof row.owner != "undefined" && row.owner !== null ? (
            row.owner
          ) : (
            <span style={{ color: "#ccc" }}>Unknown</span>
          ),
      },
      {
        name: (
          <IconColName icon={icon_conversation}>
            Conversation rating
          </IconColName>
        ),
        selector: "conversationRating",
        sortable: true,
        width: "200px",
        grow: 2,
        omit: visible_cols.indexOf("conversationRating") === -1,
        cell: (row) =>
          typeof row.conversationRating != "undefined" &&
          row.conversationRating !== null ? (
            row.conversationRating
          ) : (
            <span style={{ color: "#ccc" }}>Unknown</span>
          ),
      },
      {
        name: <IconColName icon={icon_email}>Email</IconColName>,
        selector: "email",
        sortable: true,
        width: "180px",
        omit: visible_cols.indexOf("email") === -1,
      },
      {
        name: <IconColName icon={icon_phone}>Phone</IconColName>,
        selector: "phone",
        sortable: true,
        width: "180px",
        omit: visible_cols.indexOf("phone") === -1,
        cell: (row) =>
          typeof row.phone != "undefined" && row.phone !== null ? (
            row.phone
          ) : (
            <span style={{ color: "#ccc" }}>Unknown</span>
          ),
      },
      {
        name: <IconColName icon={icon_id}>User id</IconColName>,
        selector: "id",
        sortable: true,
        width: "140px",
        omit: visible_cols.indexOf("id") === -1,
      },
      {
        name: <IconColName icon={icon_state}>State</IconColName>,
        selector: "state",
        sortable: true,
        width: "120px",
        omit: visible_cols.indexOf("state") === -1,
        // cell: row => {
        //   if(row.state == 'subscribed')
        //     return <Button color='primary' style={{textTransform: 'capitalize'}}>{row.state}</Button>
        //   if(row.state == 'passive')
        //     return <Button disabled style={{textTransform: 'capitalize'}}>{row.state}</Button>
        // }
      },
      {
        name: "Online",
        selector: "online",
        sortable: true,
        width: "80px",
        omit: visible_cols.indexOf("online") === -1,
        cell: (row) =>
          row.online === true ? (
            <RadioButtonCheckedIcon
              fontSize="small"
              style={{ color: green[500] }}
            />
          ) : (
            <RadioButtonUncheckedIcon fontSize="small" color="disabled" />
          ),
      },
      {
        name: <IconColName icon={icon_map}>Lat</IconColName>,
        selector: "lat",
        sortable: true,
        width: "100px",
        omit: visible_cols.indexOf("lat") === -1,
      },
      {
        name: <IconColName icon={icon_map}>Lng</IconColName>,
        selector: "lng",
        sortable: true,
        width: "100px",
        omit: visible_cols.indexOf("lng") === -1,
      },
      {
        name: "Postal",
        selector: "postal",
        sortable: true,
        width: "100px",
        omit: visible_cols.indexOf("postal") === -1,
      },
      {
        name: "Browser Lang",
        selector: "browserLanguage",
        sortable: true,
        width: "130px",
        omit: visible_cols.indexOf("browserLanguage") === -1,
      },
      {
        name: "Referrer",
        selector: "referrer",
        sortable: true,
        width: "180px",
        omit: visible_cols.indexOf("referrer") === -1,
      },
      {
        name: "OS",
        selector: "os",
        sortable: true,
        width: "100px",
        omit: visible_cols.indexOf("os") === -1,
      },

      {
        name: "City",
        selector: "city",
        sortable: true,
        width: "100px",
        omit: visible_cols.indexOf("city") === -1,
      },
      {
        name: "Country",
        selector: "country",
        sortable: true,
        width: "100px",
        omit: visible_cols.indexOf("country") === -1,
      },

      {
        name: "OS version",
        selector: "osVersion",
        sortable: true,
        width: "120px",
        omit: visible_cols.indexOf("osVersion") === -1,
      },
      {
        name: "Lang",
        selector: "lang",
        sortable: true,
        width: "180px",
        omit: visible_cols.indexOf("lang") === -1,
      },
      {
        name: "Web sessions",
        selector: "webSessions",
        sortable: true,
        width: "130px",
        omit: visible_cols.indexOf("webSessions") === -1,
      },
      {
        name: <IconColName icon={icon_calc}>Created at</IconColName>,
        selector: "createdAt",
        sortable: true,
        width: "180px",
        omit: visible_cols.indexOf("createdAt") === -1,
        cell: (row) => (row && row.createdAt) ? <Moment utc fromNow>{row.createdAt}</Moment> : undefined,  
      },
      {
        name: <IconColName icon={icon_calc}>First seen</IconColName>,
        selector: "firstSeen",
        sortable: true,
        width: "180px",
        omit: visible_cols.indexOf("firstSeen") === -1,
        cell: (row) => (row && row.firstSeen) ? <Moment utc fromNow>{row.firstSeen}</Moment> : undefined,  
      },
      {
        name: <IconColName icon={icon_calc}>Last seen</IconColName>,
        selector: "lastSeen",
        sortable: true,
        width: "180px",
        omit: visible_cols.indexOf("lastSeen") === -1,
        cell: (row) => (row && row.lastSeen) ? <Moment utc fromNow>{row.lastSeen}</Moment> : undefined,  
      },
      {
        name: <IconColName icon={icon_calc}>Last visited at</IconColName>,
        selector: "lastVisitedAt",
        sortable: true,
        width: "180px",
        omit: visible_cols.indexOf("lastVisitedAt") === -1,
        cell: (row) => (row && row.lastVisitedAt) ? <Moment utc fromNow>{row.lastVisitedAt}</Moment> : undefined,  
      },
    ];

    //const app_users = this.props.app_users.filter((o) => { return ( o.email) });
    const app_users = this.props.app_users;


    const handlePageChange = async page => {
      console.log("handlePageChange", page)
      this.props.actions.search(page);
      // const { perPage } = this.state;

      // this.setState({ loading: true });

      // const response = await axios.get(
      //   `https://reqres.in/api/users?page=${page}&per_page=${perPage}&delay=1`,
      // );

      // this.setState({
      //   loading: false,
      //   data: response.data.data,
      // });
    }

    const handlePerRowsChange = async (perPage, page) => {
      console.log("handlePerRowsChange", page)

      // this.setState({ loading: true });

      // const response = await axios.get(
      //   `https://reqres.in/api/users?page=${page}&per_page=${perPage}&delay=1`,
      // );

      // this.setState({
      //   loading: false,
      //   data: response.data.data,
      //   perPage,
      // });
    }

    const handleSelectAll = async ({allSelected, selectedCount, selectedRows}) => {
      this.setState({ selected_users: selectedRows })
      this.setState({ allSelected: allSelected })
    }
    

    return (

      <Wrapper>
        <div style={{marginBottom: 20}}>
          <NewUserOrLead 
            app={this.props.app}
            openNewLead={this.props.openNewLead}
            openNewUser={this.props.openNewUser}
            openImportContact={this.props.openImportContact}
            handleUserSubmit={this.handleUserSubmit}
            handleLeadSubmit={this.handleLeadSubmit}
            handleCloseNewUserOpen={this.props.handleCloseNewUserOpen }
            handleCloseNewLeadOpen={this.props.handleCloseNewLeadOpen}
            handleCloseImportContact={this.props.handleCloseImportContact}
            handleNewUserOpen={this.props.handleNewUserOpen}
            handleNewLeadOpen={this.props.handleNewLeadOpen}
            handleImportContact={this.props.handleImportContact}
          />
        </div>

        <h3 style={{ textTransform: 'capitalize', width: "100%", margin: "unset", fontWeight: "400", fontSize: 20, fontFamily: 'Proxima Nova' }}>
          {this.props.segment.name || "All"}
        </h3>
        <h1
          style={{
            width: "100%",
            margin: "unset",
            marginBottom: "10px",
            fontSize: "42px",
            fontWeight: "400",
          }}
        >
          {this.props.meta.total_count}
        </h1>

        {this.caption(visible_cols)}

        {/*{this.state.map_view &&*/}
        {/*!this.props.searching &&*/}
        {/*this.props.app.key &&*/}
        {/*this.props.segment &&*/}
        {/*this.props.segment.id ? (*/}
        {/*  <Map*/}
        {/*    interactive={true}*/}
        {/*    segment={this.props.segment}*/}
        {/*    data={app_users}*/}
        {/*  />*/}
        {/*) : null}*/}

        <ButtonGroup1 >
          <ExportUsers selectedUsers={this.state.selected_users} app={this.props.app} dispatch={this.props.dispatch} allSelected={this.state.allSelected} />
          <ArchiveUsers selectedUsers={this.state.selected_users} app={this.props.app} dispatch={this.props.dispatch} allSelected={this.state.allSelected} />
        </ButtonGroup1>

        {!this.props.searching && (
          <Datatable
            columns={columns}
            data={app_users}
            onSelectedRowsChange={(s) =>
              this.setState({ selected_users: s.selectedRows })
            }
            pagination
            paginationServer
            paginationPerPage={20}
            paginationRowsPerPageOptions={[20]}
            paginationDefaultPage={this.props.meta.current_page} 
            paginationTotalRows={this.props.meta.total_count}
            onChangeRowsPerPage={handlePerRowsChange}
            onChangePage={handlePageChange}
            sortServer={false}
            onSelectedRowsChange={handleSelectAll}
          />
        )}

        {this.props.searching && <CircularProgress />}
      </Wrapper>
    );
  }
}

function EditColumnList(props) {
  const [columnSearch, setColumnSearch] = React.useState("");
  const [anchorEl, setAnchorEl] = React.useState(null);
  //const [options, setOptions] = React.useState(props.options);

  function handleClick(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  function handleChange(o) {
    const item = Object.assign({}, o, { hidden: !o.hidden });
    const columns = props.options.map((o) => {
      return o.title === item.title ? item : o;
    });
    //setOptions(columns)
    //console.log(item)
    props.handleChange(columns);
    //setOptions()
  }

  function handleColumnSearchChange(e) {
    setColumnSearch(e.target.value);
  }

  //React.useEffect(() => console.log('value changed!'), [props.options]);

  return (
    <div  style={{position:"absolute", right:"0"}}>
      <Button
          isLoading={false}
          variant="contained"
          onClick={null}
      >

        &nbsp;&nbsp;&nbsp;
        <img src={icon_save} style={{ height: "20px" }} />
        &nbsp;&nbsp;New  Message&nbsp;&nbsp;&nbsp;
      </Button>

      <Button
        variant="outlined"
        color="primary"
        onClick={handleClick}
        aria-controls="simple-menu"
        aria-haspopup="true"
        justifyContent="flex-end"
        
      >
        &nbsp;&nbsp;&nbsp;
        <img src={icon_col} style={{ height: "20px" }} />
        &nbsp;&nbsp;Edit columns&nbsp;&nbsp;&nbsp;
      </Button>

      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <Input
          placeholder="Search column"
          onChange={handleColumnSearchChange}
        />
        <div className="list-scroll-menu" style={{ height: "360px" }}>
          {props.options
            .filter((o) => {
              return (
                o.title.toLowerCase().indexOf(columnSearch.toLowerCase()) > -1
              );
            })
            .map((o) => (
              <MenuItem
                key={`simple-menu-${o.title}`}
                style={{ paddingLeft: "0" }}
              >
                <Checkbox
                  checked={props.visible_cols.indexOf(o.field) !== -1}
                  inputProps={{
                    "aria-label": "primary checkbox",
                  }}
                  onChange={() => props.onChange(o.field)}
                />
                {o.title}
              </MenuItem>
            ))}
        </div>
      </Menu>
    </div>
  );
}

const userFormat = function (showUserDrawer, app) {
  let opts = [
    //{field: 'id', title: 'id' },
    {
      field: "displayName",
      title: "Name",
      render: (row) => {
        return (
          row && (
            <NameWrapper onClick={(e) => showUserDrawer && showUserDrawer(row)}>
              <AvatarWrapper>
                <UserBadge row={row} />
              </AvatarWrapper>

              <Grid container direction={"column"}>
                <Typography variant="overline" display="block">
                  {row.displayName}
                </Typography>

                <Typography variant={"caption"}>{row.email}</Typography>
              </Grid>
            </NameWrapper>
          )
        );
      },
    },
    { field: "type", title: "Type" },
    { field: "owner", title: "Owner", hidden: true  },
    { field: "conversationRating", title: "Conversation Rating", hidden: true  },
    { field: "email", title: "email" },
    { field: "phone", title: "Phone" },
    { field: "id", title: "User id" },
    {
      field: "state",
      title: "State",
      render: (row) => {
        return (
          <Chip
            color={row.state === "subscribed" ? "primary" : "secondary"}
            label={row.state}
            clickable={false}
          />
        );
      },
    },
    { field: "online", title: "Online", hidden: true },
    { field: "lat", title: "Lat", hidden: true },
    { field: "lng", title: "Lng", hidden: true },
    { field: "postal", title: "Postal", hidden: true },
    { field: "browserLanguage", title: "Browser Language", hidden: true },
    { field: "referrer", title: "Referrer", hidden: true },
    { field: "os", title: "OS", hidden: true },
    { field: "osVersion", title: "OS Version", hidden: true },
    { field: "lang", title: "Lang", hidden: true },
    { field: "webSessions", title: "Web sessions" },
    { field: "lastSeen", title: "Last seen" },
    { field: "firstSeen", title: "First seen" },
    { field: "city", title: "City" },
    { field: "country", title: "Country" },

    {
      field: "createdAt",
      title: "Created at",
      render: (row) =>
        row ? <Moment utc fromNow>{row.createdAt}</Moment> : undefined,
    },
    {
      field: "lastVisitedAt",
      title: "Last visited at",
      render: (row) =>
        row ? <Moment utc fromNow>{row.lastVisitedAt}</Moment> : undefined,
    },
  ];

  if (app.customFields && app.customFields.length > 0) {
    const other = app.customFields.map((o) => ({
      hidden: true,
      field: o.name,
      title: o.name,
      render: (row) => row && row.properties[o.name],
    }));
    opts = opts.concat(other);
  }

  return opts;
};

function mapStateToProps(state) {
  const { auth, app, segment, app_users, app_user } = state;
  const { loading, isAuthenticated } = auth;

  const { searching, meta } = app_users;

  return {
    app_user,
    app_users,
    searching,
    meta,
    segment,
    app,
    loading,
    isAuthenticated,
  };
}

export default withRouter(connect(mapStateToProps)(AppContent));
