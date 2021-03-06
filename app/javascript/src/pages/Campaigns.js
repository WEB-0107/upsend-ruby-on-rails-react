import React, { Component } from "react";
import { Route, Switch } from "react-router-dom";

import { withRouter } from "react-router-dom";
import { AnchorLink } from "../shared/RouterLink";
import { UpgradeDialog } from "../shared/planUpgradeMessage";
import { connect } from "react-redux";
import ContentWrapper from "../components/ContentWrapper";
import PageTitle from "../components/PageTitle";
//import Tabs from '@atlaskit/tabs';
import Moment from "react-moment";
import styled from "@emotion/styled";
import serialize from "form-serialize";

import CampaignSettings from "./campaigns/settings";
import CampaignEditor from "./campaigns/editor";
import SegmentManager from "../components/segmentManager";
import DeleteDialog from "../components/deleteDialog";
import CampaignStats from "../components/stats";

import { isEmpty } from "lodash";

import { parseJwt, generateJWT } from "../components/segmentManager/jwt";
import TourManager from "../components/Tour";
import ContentHeader from "../components/ContentHeader";
import Content from "../components/Content";
import EmptyView from "../components/emptyView";

import graphql from "../graphql/client";
import { CAMPAIGN, CAMPAIGNS, CAMPAIGN_METRICS } from "../graphql/queries";
import {
  PREDICATES_SEARCH,
  UPDATE_CAMPAIGN,
  CREATE_CAMPAIGN,
  DELIVER_CAMPAIGN,
  PURGE_METRICS,
  DELETE_CAMPAIGN,
} from "../graphql/mutations";

import { getAppUser } from "../actions/app_user";
import { toggleDrawer } from "../actions/drawer";

import Table from "../components/table/index";
import { Datatable } from "../components/datatable/";

import SelectMenu from "../components/selectMenu";

import EmailIcon from "@material-ui/icons/Email";
import MessageIcon from "@material-ui/icons/Message";
import FilterFramesIcon from "@material-ui/icons/FilterFrames";
import ClearAll from "@material-ui/icons/ClearAll";
import DeleteOutlineRounded from "@material-ui/icons/DeleteOutlineRounded";

import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Chip from "@material-ui/core/Chip";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Badge from "@material-ui/core/Badge";
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";

import CheckCircle from "@material-ui/icons/CheckCircle";
import Pause from "@material-ui/icons/Pause";
import VisibilityRounded from "@material-ui/icons/VisibilityRounded";
import SendRounded from "@material-ui/icons/SendRounded";
import DeleteForeverRounded from "@material-ui/icons/DeleteForeverRounded";

import { setCurrentSection, setCurrentPage } from "../actions/navigation";

import userFormat from "../components/table/userFormat";

import { errorMessage, successMessage } from "../actions/status_messages";
import StatusBadge from "../components/StatusBadge";

const BtnTabContainer = styled.div`
  background-color: #fff;

  button {
    margin-left: 0;
    min-width: 140px;
    min-height: unset;

    span {
      border-radius: 4px;
      padding: 10px;
      z-index: 1;
    }
  }

  button.Mui-selected {
    font-weight: 600;

    span {
      background-color: rgb(250, 247, 242);
    }
  }
`;

const options = [
  {
    title: "Enable",
    description: "enables the campaign",
    icon: <CheckCircle />,
    id: "enabled",
    state: "enabled",
  },
  {
    title: "Pause",
    description: "pauses the campaign ",
    icon: <Pause />,
    id: "disabled",
    state: "disabled",
  },
];

class CampaignSegment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      jwt: null,
      app_users: [],
      search: false,
      meta: {},
    };
  }
  componentDidMount() {
    /*this.props.actions.fetchAppSegment(
      this.props.app.segments[0].id
    )*/
    this.search();
  }

  handleSave = (e) => {
    const predicates = parseJwt(this.state.jwt);
    //console.log(predicates)

    const params = {
      appKey: this.props.app.key,
      id: this.props.data.id,
      campaignParams: {
        segments: predicates.data,
      },
    };

    graphql(UPDATE_CAMPAIGN, params, {
      success: (data) => {
        this.props.successMessage();
      },
      error: () => {},
    });
  };

  updateData = (data, cb) => {
    const newData = Object.assign({}, this.props.data, { segments: data.data });
    this.props.updateData(newData, cb ? cb() : null);
  };

  updatePredicate = (data, cb) => {
    const jwtToken = generateJWT(data);
    //console.log(parseJwt(jwtToken))
    if (cb) cb(jwtToken);
    this.setState({ jwt: jwtToken }, () =>
      this.updateData(parseJwt(this.state.jwt), this.search)
    );
  };

  addPredicate = (data, cb) => {
    const pending_predicate = {
      attribute: data.name,
      comparison: null,
      type: data.type,
      value: data.value,
    };

    const new_predicates = this.props.data.segments.concat(pending_predicate);
    const jwtToken = generateJWT(new_predicates);
    //console.log(parseJwt(jwtToken))
    if (cb) cb(jwtToken);

    this.setState({ jwt: jwtToken }, () =>
      this.updateData(parseJwt(this.state.jwt))
    );
  };

  deletePredicate(data) {
    const jwtToken = generateJWT(data);
    this.setState({ jwt: jwtToken }, () =>
      this.updateData(parseJwt(this.state.jwt), this.search)
    );
  }

  search = (page) => {
    this.setState({ searching: true });
    // jwt or predicates from segment
    //console.log(this.state.jwt)
    const data = this.state.jwt
      ? parseJwt(this.state.jwt).data
      : this.props.data.segments;
    const predicates_data = {
      data: {
        source: "campaign",
        source_id: this.props.data.id,
        predicates: data.filter((o) => o.comparison),
      },
    };

    graphql(
      PREDICATES_SEARCH,
      {
        appKey: this.props.app.key,
        search: predicates_data,
        page: page || 1,
      },
      {
        success: (data) => {
          const appUsers = data.predicatesSearch.appUsers;
          this.setState({
            app_users: appUsers.collection,
            meta: appUsers.meta,
            searching: false,
          });
        },
        error: (error) => {
          debugger;
        },
      }
    );
  };

  showUserDrawer = (o) => {
    this.props.dispatch(
      toggleDrawer({ rightDrawer: true }, () => {
        this.props.dispatch(getAppUser(o.id));
      })
    );
  };

  render() {
    return (
      <SegmentManager
        {...this.props}
        loading={this.state.searching}
        predicates={this.props.data.segments}
        meta={this.state.meta}
        collection={this.state.app_users}
        updatePredicate={this.updatePredicate.bind(this)}
        addPredicate={this.addPredicate.bind(this)}
        deletePredicate={this.deletePredicate.bind(this)}
        search={this.search.bind(this)}
        loading={this.props.searching}
        columns={userFormat(this.showUserDrawer, this.props.app, this.props.data.configTableColumns)}
        defaultHiddenColumnNames={[
          "id",
          "state",
          "online",
          "lat",
          "lng",
          "postal",
          "browserLanguage",
          "referrer",
          "os",
          "osVersion",
          "lang",
        ]}
        //selection [],
        tableColumnExtensions={[
          //{ columnName: 'id', width: 150 },
          { columnName: "email", width: 250 },
          { columnName: "lastVisitedAt", width: 120 },
          { columnName: "os", width: 100 },
          { columnName: "osVersion", width: 100 },
          { columnName: "state", width: 80 },
          { columnName: "online", width: 80 },
          //{ columnName: 'amount', align: 'right', width: 140 },
        ]}
        leftColumns={["email"]}
        rightColumns={["online"]}
        //toggleMapView={this.toggleMapView}
        //map_view={this.state.map_view}
        //enableMapView={true}
      >
        {this.state.jwt ? (
          <Button
            isLoading={false}
            appearance={"link"}
            onClick={this.handleSave}
          >
            <i className="fas fa-chart-pie"></i> Save Segment
          </Button>
        ) : null}
      </SegmentManager>
    );
  }
}

class CampaignForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: 0,
      data: {},
      tabValue: 0,
    };
  }

  url = () => {
    const id = this.props.match.params.id;
    return `/apps/${this.props.app.key}/campaigns/${id}`;
  };

  componentDidMount() {
    this.fetchCampaign();
  }

  deleteCampaign = (cb) => {
    graphql(
      DELETE_CAMPAIGN,
      {
        appKey: this.props.app.key,
        id: this.state.data.id,
      },
      {
        success: (data) => {
          console.log(data);
          cb && cb();
        },
        error: (error) => {
          console.log(error);
        },
      }
    );
  };

  fetchCampaign = (cb) => {
    const id = this.props.match.params.id;

    if (id === "new") {
      graphql(
        CREATE_CAMPAIGN,
        {
          appKey: this.props.app.key,
          mode: this.props.mode,
          operation: "new",
          campaignParams: {},
        },
        {
          success: (data) => {
            this.setState(
              {
                data: data.campaignCreate.campaign,
              },
              cb && cb
            );
          },
        }
      );
    } else {
      graphql(
        CAMPAIGN,
        {
          appKey: this.props.app.key,
          mode: this.props.mode,
          id: id,
        },
        {
          success: (data) => {
            this.setState(
              {
                data: data.app.campaign,
              },
              cb && cb
            );
          },
        }
      );
    }
  };

  updateData = (data, cb) => {
    this.setState({ data: data }, cb && cb());
  };


  updateColumnPreferences = (columns, cb) => {
    const params = {
      appKey: this.props.app.key,
      id: this.state.data.id,
      campaignParams: {
        config_table_columns: columns,
      },
    };

    graphql(UPDATE_CAMPAIGN, params, {
      success: (data) => {
        console.log(data);
        this.setState({
            data: data.campaignUpdate.campaign,
          });
        //this.successMessage();
      },
      error: () => {},
    });
  };


  renderEditorForCampaign = () => {
    switch (this.props.mode) {
      case "tours":
        return (
          <TourManager
            {...this.props}
            url={this.url()}
            updateData={this.updateData}
            data={this.state.data}
          />
        );
        break;

      default:
        return (
          <CampaignEditor
            {...this.props}
            url={this.url()}
            updateData={this.updateData}
            data={this.state.data}
          />
        );
        break;
    }
  };

  handleTabChange = (e, i) => {
    this.setState({ tabValue: i });
  };

  tabsContent = () => {
    return (
      <BtnTabContainer>
        <Tabs
          value={this.state.tabValue}
          onChange={this.handleTabChange}
          textColor="inherit"
          style={{
            marginLeft: "48px",
            marginRight: "48px",
            padding: "16px 0",
            borderTop: "solid 1px rgba(0,0,0,0.12)",
          }}
        >
          <Tab textColor="inherit" label="Stats" />
          <Tab textColor="inherit" label="Settings" />
          <Tab textColor="inherit" label="Audience" />
          <Tab textColor="inherit" label="Editor" />
        </Tabs>
      </BtnTabContainer>
    );
  };

  getStats = (params, cb) => {
    graphql(CAMPAIGN_METRICS, params, {
      success: (data) => {
        const d = data.app.campaign;
        cb(d);
      },
      error: (error) => {},
    });
  };

  renderTabcontent = () => {
    switch (this.state.tabValue) {
      case 0:
        return (
          <CampaignStats
            {...this.props}
            url={this.url()}
            data={this.state.data}
            fetchCampaign={this.fetchCampaign}
            updateData={this.updateData}
            getStats={this.getStats}
          />
        );

      case 1:
        return (
          <CampaignSettings
            {...this.props}
            data={this.state.data}
            mode={this.props.mode}
            successMessage={() =>
              this.props.dispatch(successMessage("campaign updated"))
            }
            url={this.url()}
            updateData={this.updateData}
          />
        );
      case 2:
        return (
          <CampaignSegment
            {...this.props}
            data={this.state.data}
            url={this.url()}
            successMessage={() =>
              this.props.dispatch(successMessage("campaign updated"))
            }
            updateData={this.updateData}
            updateColumnPreferences={this.updateColumnPreferences}
          />
        );
      case 3:
        return this.renderEditorForCampaign();
    }
  };

  isNew = () => {
    return this.props.match.params.id === "new";
  };

  handleSend = (e) => {
    const params = {
      appKey: this.props.app.key,
      id: this.state.data.id,
    };

    graphql(DELIVER_CAMPAIGN, params, {
      success: (data) => {
        this.updateData(data.campaignDeliver.campaign, null);
        //this.setState({ status: "saved" })
      },
      error: () => {},
    });
  };

  campaignName = (name) => {
    switch (name) {
      case "campaigns":
        return "Mailing Campaign";
        break;
      case "user_auto_messages":
        return "In app messages";

      default:
        return name;
        break;
    }
  };

  toggleCampaignState = () => {
    graphql(
      UPDATE_CAMPAIGN,
      {
        appKey: this.props.app.key,
        id: this.state.data.id,
        campaignParams: {
          state: this.state.data.state === "enabled" ? "disabled" : "enabled",
        },
      },
      {
        success: (data) => {
          this.setState({
            data: data.campaignUpdate.campaign,
          });
          this.props.dispatch(successMessage("campaign updated"));
        },
        error: () => {
          this.props.dispatch(errorMessage("error updating campaign"));
        },
      }
    );
  };

  iconMode = (name) => {
    switch (name) {
      case "campaigns":
        return <EmailIcon />;
      case "user_auto_messages":
        return <MessageIcon />;
      case "tours":
        return <FilterFramesIcon />;
      default:
        return name;
        break;
    }
  };

  optionsForMailing = () => {
    return [
      {
        title: "Preview",
        description: "preview campaign's message",
        icon: <VisibilityRounded />,
        id: "preview",
        onClick: (e) => {
          window.open(
            `${window.location.origin}/apps/${this.props.app.key}/premailer/${this.state.data.id}`,
            "_blank"
          );
        },
      },
      {
        title: "Deliver",
        description: "delivers the campaign",
        icon: <SendRounded />,
        id: "deliver",
        onClick: this.handleSend,
      },
    ];
  };

  deleteOption = () => {
    return {
      title: "Delete",
      description: "delete the campaign",
      icon: <DeleteOutlineRounded />,
      id: "delete",
      onClick: this.openDeleteDialog,
    };
  };

  optionsForData = () => {
    let newOptions = options;
    if (this.props.mode === "campaigns") {
      newOptions = this.optionsForMailing().concat(options);
    }

    newOptions = newOptions.filter((o) => o.state != this.state.data.state);

    newOptions = newOptions.concat(this.purgeMetricsOptions());

    newOptions.push(this.deleteOption());

    return newOptions;
  };

  purgeMetricsOptions = () => {
    return {
      title: "Purge Metrics",
      description: "purges campaigns metrics",
      icon: <ClearAll />,
      id: "deliver",
      onClick: this.purgeMetrics,
    };
  };

  openDeleteDialog = () => {
    this.setState({
      deleteDialog: true,
    });
  };

  purgeMetrics = () => {
    graphql(
      PURGE_METRICS,
      {
        appKey: this.props.app.key,
        id: parseInt(this.props.match.params.id),
      },
      {
        success: (data) => {
          this.fetchCampaign(() => {
            this.props.dispatch(successMessage("campaign updated"));
          });
        },
        error: () => {
          this.props.dispatch(errorMessage("error purging metrics"));
        },
      }
    );
  };

  render() {
    const title = this.state.data.name
      ? `${this.state.data.name}`
      : this.campaignName(this.props.mode);

    return (
      <div>
        {this.state.deleteDialog && (
          <DeleteDialog
            open={this.state.deleteDialog}
            title={`Delete campaign "${this.state.data.name}"`}
            deleteHandler={() => {
              this.deleteCampaign(() => {
                this.setState(
                  {
                    deleteDialog: false,
                  },
                  () => {
                    this.props.history.push(
                      `/apps/${this.props.app.key}/messages/${this.props.mode}`
                    );
                  }
                );
              });
            }}
          >
            <Typography variant="subtitle2">
              we will destroy any content and related data
            </Typography>
          </DeleteDialog>
        )}

        <ContentHeader
          title={
            <Grid container alignContent="space-around" alignItems="center">
              <Grid item style={{ display: "flex", alignItems: "center" }}>
                <span>{title}</span>
                &nbsp;&nbsp;&nbsp;
                <StatusBadge type="success">
                  {this.state.data.state}
                </StatusBadge>
              </Grid>
            </Grid>
          }
          items={
            <React.Fragment>
              <Grid item>
                <SelectMenu
                  options={this.optionsForData()}
                  selected={this.state.data.state}
                  handleClick={(e) => this.toggleCampaignState(e.state)}
                  toggleButton={(clickHandler) => {
                    return (
                      <Button
                        onClick={clickHandler}
                        variant="outlined"
                        color="inherit"
                        size="small"
                      >
                        {"actions"}
                      </Button>
                    );
                  }}
                />
              </Grid>
            </React.Fragment>
          }
        />
        {this.isNew() ? null : this.tabsContent()}

        <div style={{ padding: "0 50px 27px", backgroundColor: "#fff" }}>
          {!isEmpty(this.state.data) ? (
            this.isNew() ? (
              <CampaignSettings
                {...this.props}
                data={this.state.data}
                mode={this.props.mode}
                url={this.url()}
                updateData={this.updateData}
                successMessage={() =>
                  this.props.dispatch(successMessage("campaign updated"))
                }
              />
            ) : (
              this.renderTabcontent()
            )
          ) : null}
        </div>
      </div>
    );
  }
}

class CampaignContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      campaigns: [],
      meta: {},
      openDeleteDialog: null,
      visible_cols: ["name", "subject", "state", "actions"],
      selected_users: [],
      requiresUpgrade: false,
      showUpgradeDialog: false
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      (this.props.match.params.message_type !==
      prevProps.match.params.message_type) || (this.props.getCampaignNeedToUpdateCount !==
      prevProps.getCampaignNeedToUpdateCount)
    ) {
      this.props.dispatch(setCurrentPage(this.props.match.params.message_type));
      this.props.dispatch(setCurrentSection("Campaigns"));
      this.init();
    }
  }

  componentDidMount() {
    this.props.dispatch(setCurrentSection("Campaigns"));
    this.props.dispatch(setCurrentPage(this.props.match.params.message_type));
    this.init();
  }

  init = (page) => {
    this.setState({
      loading: true,
    });

    graphql(
      CAMPAIGNS,
      {
        appKey: this.props.match.params.appId,
        mode: this.props.match.params.message_type,
        page: page || 1,
      },
      {
        success: (data) => {
          const { collection, meta } = data.app.campaigns;
          this.setState({
            campaigns: collection,
            meta: meta,
            loading: false,
            requiresUpgrade: data.app.upgradeToCreateCampaigns
          });
        },
      }
    );
  };

  deleteActionClick = (id, name) => {
    this.setState({openDeleteDialog: {name: name, id: id}})
  };

  createNewCampaign = (e) => {
    this.props.history.push(`${this.props.match.url}/new`);
  };

  handleRowClick = (a, data, c) => {
    const row = this.state.campaigns[data.dataIndex];
    this.props.history.push(`${this.props.match.url}/${row.id}`);
  };


  openUpgradeDialog = () => {
    this.setState({showUpgradeDialog: true})
  };

  closeUpgradeDialog = () => {
    this.setState({showUpgradeDialog: false})
  };

  renderActions = () => {
    return (
      <Grid container justify={"flex-end"}>
        <Button
          variant={"contained"}
          color={"primary"}
          onClick={this.state.requiresUpgrade ? this.openUpgradeDialog : this.createNewCampaign}
        >
          create new campaign
        </Button>
      </Grid>
    );
  };

  deleteCampaign = (id, cb) => {
    graphql(
      DELETE_CAMPAIGN,
      {
        appKey: this.props.app.key,
        id: id,
      },
      {
        success: (data) => {
          console.log(data);
          cb && cb();
        },
        error: (error) => {
          console.log(error);
        },
      }
    );
  };

  url = () => {
    const id = this.props.match.params.id;
    return `/apps/${this.props.app.key}/campaigns/${id}`;
  };

  render() {
    // console.log('here',this.state.campaigns);
    const columns = [
      {
        name: "Name",
        selector: "name",
        sortable: true,
        width: "160px",
        omit: this.state.visible_cols.indexOf("name") === -1,
        cell: (row) => (
          <AnchorLink to={`${this.props.match.url}/${row.id}`}>
            {row.name}
          </AnchorLink>
        ),
      },
      {
        name: "Subject",
        selector: "subject",
        sortable: true,
        width: "260px",
        omit: this.state.visible_cols.indexOf("subject") === -1,
      },
      {
        name: "State",
        selector: "state",
        sortable: true,
        width: "100px",
        omit: this.state.visible_cols.indexOf("state") === -1,
      },
      {
        name: "Actions",
        sortable: true,
        omit: this.state.visible_cols.indexOf("actions") === -1,
        cell: (row) => (
          <div>
            <AnchorLink to={`${this.props.match.url}/${row.id}`}>Edit</AnchorLink>|
            <AnchorLink to = '#' onClick={() => this.deleteActionClick(row.id, row.name)} >Delete</AnchorLink>
          </div>
        )
      },
    ];

    return (
      <div>
        <Switch>
          <Route
            exact
            path={`${this.props.match.url}/:id`}
            render={(props) => (
              this.props.match.params.message_type == 'tours' ?
              <TourManager
                {...this.props}
                url={this.url()}
                updateData={this.updateData}
                data={this.state.data || {}}
              /> :
              <CampaignForm
                currentUser={this.props.currentUser}
                mode={this.props.match.params.message_type}
                {...this.props}
                {...props}
              />
            )}
          />

          <Route
            exact
            path={`${this.props.match.url}`}
            render={(props) => (
              <div>
                {this.state.openDeleteDialog && (
                  <DeleteDialog
                    open={this.state.openDeleteDialog}
                    title={`Delete campaign "${this.state.openDeleteDialog.name}"`}
                    closeHandler={() => {
                      this.setState({ openDeleteDialog: null });
                    }}
                    deleteHandler={() => {
                      this.deleteCampaign(
                        this.state.openDeleteDialog.id,
                        () => {
                          this.init();
                          this.setState({ openDeleteDialog: null });
                          this.props.dispatch(
                            successMessage("campaign removed")
                          );
                        }
                      );
                    }}
                  >
                    <Typography variant="subtitle2">
                      we will destroy any content and related data
                    </Typography>
                  </DeleteDialog>
                )}

                <Content actions={this.renderActions()}>

                  <UpgradeDialog isOpen={this.state.showUpgradeDialog} handleClose={this.closeUpgradeDialog} />
                  <div
                    style={{
                      padding: "20px 26px",
                      fontSize: "26px",
                      fontWeight: "600",
                      borderBottom: "solid 1px rgba(0,0,0,.125)",
                    }}
                  >
                    Campaign
                  </div>
                  {!this.state.loading && this.state.campaigns.length > 0 ? (
                    // <Table
                    //   meta={this.state.meta}
                    //   data={this.state.campaigns}
                    //   title={`campaigns`}
                    //   //title={`${this.props.match.params.message_type} campaign`}
                    //   defaultHiddenColumnNames={[]}
                    //   search={this.init.bind(this)}
                    //   columns={[
                    //     {
                    //       field: "name",
                    //       title: "name",
                    //       render: (row) =>
                    //         row ? (
                    //           <AnchorLink
                    //             to={`${this.props.match.url}/${row.id}`}
                    //           >
                    //             {row.name}
                    //           </AnchorLink>
                    //         ) : undefined,
                    //     },
                    //     { field: "subject", title: "subject" },
                    //     {
                    //       field: "state",
                    //       title: "state",
                    //       render: (row) => {
                    //         return (
                    //           <Chip
                    //             label={row.state}
                    //             variant="outlined"
                    //             size="small"
                    //             color={
                    //               row.state === "enabled"
                    //                 ? "primary"
                    //                 : "default"
                    //             }
                    //             icon={
                    //               row.state === "enabled" ? (
                    //                 <CheckCircle />
                    //               ) : (
                    //                 <Pause />
                    //               )
                    //             }
                    //           />
                    //         );
                    //       },
                    //     },
                    //     {
                    //       field: "actions",
                    //       title: "actions",
                    //       render: (row) => (
                    //         <Button
                    //           color={"secondary"}
                    //           variant={"contained"}
                    //           onClick={() =>
                    //             this.setState({ openDeleteDialog: row })
                    //           }
                    //         >
                    //           remove
                    //         </Button>
                    //       ),
                    //     },
                    //     /*{field: 'fromName', title: 'from name', hidden: true},
                    //     {field: 'fromEmail', title: 'from email', hidden: true},
                    //     {field: 'replyEmail', title: 'reply email', hidden: true},
                    //     {field: 'description', title: 'description', hidden: true},
                    //     {field: 'timezone', title: 'timezone'},
                    //     {field: 'scheduledAt', title: 'scheduled at', type: "datetime",
                    //       render: row => (row ? <Moment fromNow>
                    //         {row.scheduledAt}
                    //       </Moment> : undefined)
                    //     },
                    //     {field: 'scheduledTo', title: 'scheduled to', type: "datetime",
                    //       render: row => (row ? <Moment fromNow>
                    //         {row.scheduledTo}
                    //       </Moment> : undefined)
                    //     }*/
                    //   ]}
                    // ></Table>
                    <Datatable
                      columns={columns}
                      data={this.state.campaigns}
                      pagination
                      onSelectedRowsChange={(s) =>
                        this.setState({ selected_users: s.selectedRows })
                      }
                    />
                  ) : null}

                  {!this.state.loading && this.state.campaigns.length === 0 ? (
                    <EmptyView
                      title={"No campaigns found"}
                      subtitle={
                        <div>
                          create a new one
                          {this.renderActions()}
                        </div>
                      }
                    />
                  ) : null}

                  {this.state.loading ? <CircularProgress /> : null}
                </Content>
              </div>
            )}
          />
        </Switch>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { auth, app, campaigns } = state;
  const { getCampaignNeedToUpdateCount } = campaigns;
  const { loading, isAuthenticated } = auth;

  return {
    app,
    loading,
    isAuthenticated,
    getCampaignNeedToUpdateCount,
  };
}

export default withRouter(connect(mapStateToProps)(CampaignContainer));
