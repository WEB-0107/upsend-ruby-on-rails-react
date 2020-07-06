import React from "react";
import MaterialTable, { MTableToolbar } from "material-table";

import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Checkbox from "@material-ui/core/Checkbox";
import TextField from "@material-ui/core/TextField";

import ChevronLeft from "@material-ui/icons/ChevronLeft";
import ChevronRight from "@material-ui/icons/ChevronRight";
import FirstPage from "@material-ui/icons/FirstPage";
import LastPage from "@material-ui/icons/LastPage";
import ViewColumn from "@material-ui/icons/ViewColumn";

import MapIcon from "@material-ui/icons/Map";
import styled from "@emotion/styled";

import { capitalize } from "lodash";

const PaperTableContainer = styled("div")`
  max-width: 100%;
  
  .container{
    margin-right: auto;
    margin-left: auto;
    margin-top: 50px;
    //padding: 10px;
    //margin: 10px;
  }
  
  .title {
    margin-top: 20px;
    text-align: center;
  }
  
  tr {
    height: 40px !important;
  }
  
  @media (max-width: 640px){
    th {
      max-width: 125px;
      min-width: 125px;
      padding: 0 !important;
      white-space: nowrap;
      /*text-align: center !important;*/
    }
    
    td {
      height: 40px !important;
      padding: 5px !important;
      /*text-align: center !important;*/
    }
  }
  
}`;

export default class Table extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      columns: this.props.columns,
    };
  }

  dataFromProps = () => {};

  changeColumns = (columns) => {
    this.props.updateSegmentState(columns);
    this.setState({ columns: columns });
  };

  render() {
    return (
      <PaperTableContainer>
        <MaterialTable
          title={capitalize(this.props.title)}
          columns={this.state.columns}
          data={this.props.data}
          options={{
            pageSize: this.props.data && this.props.data.length,
          }}
          components={{
            Container: (props) => (
              <Paper
                {...props}
                className="container"
                elevation={this.props.elevation || 0}
              />
            ),
            Pagination: (props) => {
              return (
                <Grid container alignItems={"center"} justify={"center"}>
                  <Grid item>
                    <IconButton
                      disabled={!this.props.meta.prev_page}
                      onClick={() =>
                        this.props.search(this.props.meta.prev_page)
                      }
                    >
                      <ChevronLeft />
                    </IconButton>
                  </Grid>

                  <Grid item>
                    <Typography variant={"caption"}>
                      {this.props.meta.current_page} of{" "}
                      {this.props.meta.total_pages} pages (
                      {this.props.meta.total_count} records)
                    </Typography>
                  </Grid>

                  <Grid item>
                    <IconButton
                      disabled={!this.props.meta.next_page}
                      onClick={() =>
                        this.props.search(this.props.meta.next_page)
                      }
                    >
                      <ChevronRight />
                    </IconButton>
                  </Grid>
                </Grid>
              );
            },

            Toolbar: (props) => {
              return (
                <Grid container alignItems={"center"} justify={"space-between"}>
                  <Grid item>
                    <Typography variant={"h5"}>{this.props.title}</Typography>
                  </Grid>

                  <Grid item>
                    <Grid container justify={"space-around"}>
                      <SimpleMenu
                        handleChange={this.changeColumns}
                        options={this.state.columns}
                      />

                      {this.props.enableMapView ? (
                        <Button
                          color="primary"
                          variant="outlined"
                          onClick={this.props.toggleMapView}
                        >
                          <MapIcon /> Toggle map
                        </Button>
                      ) : null}
                    </Grid>
                  </Grid>
                </Grid>
              );
            },
          }}
        />
      </PaperTableContainer>
    );
  }
}

function SimpleMenu(props) {
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

  //console.log(props.options)
  return (
    <div>
      <Button
        color="primary"
        variant="outlined"
        onClick={handleClick}
        aria-controls="simple-menu"
        aria-haspopup="true"
      >
        <ViewColumn /> Edit columns
      </Button>

      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem style={{ width: "250px" }}>
          <TextField
            label="Search column"
            type="standard-basic"
            onChange={handleColumnSearchChange}
          />
        </MenuItem>
        <div>
          {props.options
            .filter((o) => {
              return (
                o.title.toLowerCase().indexOf(columnSearch.toLowerCase()) > -1
              );
            })
            .map((o) => (
              <MenuItem
                key={`simple-menu-${o.title}`}
                onClick={() => handleChange(o)}
              >
                <Checkbox
                  defaultChecked={!o.hidden}
                  inputProps={{
                    "aria-label": "primary checkbox",
                  }}
                />
                {o.title}
              </MenuItem>
            ))}
        </div>
      </Menu>
    </div>
  );
}
