import React, { Component, useState } from "react";
import "antd/dist/antd.css";
import { Drawer, Space } from "antd";
import { Menu, Dropdown, notification } from "antd";
import { DownOutlined, InfoCircleTwoTone } from "@ant-design/icons";
import { BiLayer, BiLineChart, BiDownload, BiX } from "react-icons/bi";
import geojson from "../Shapes/Telangana.json";
import Captcha from "demos-react-captcha";
import { geoMercator, geoPath } from "d3-geo";
import { select } from "d3-selection";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col,
  Label,
  FormGroup,
  Card,
  Table,
  CardBody,
} from "reactstrap";
import {
  AvForm,
  AvField,
  AvGroup,
  AvInput,
  AvFeedback,
  AvRadioGroup,
  AvRadio,
  AvCheckboxGroup,
  AvCheckbox,
} from "availity-reactstrap-validation";
import Chart from "react-apexcharts";
import { message } from "antd";
import axios from "axios";
import axiosConfig from "../Common/axios_Config";
import Loader from "../img/loader.gif";
import { connect } from "react-redux";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const mapStateToProps = (ReduxProps) => {
  return {
    CurrentLayer: ReduxProps.CurrentLayer,
    LayerDescription: ReduxProps.LayerDescription,
    CurrentRegion: ReduxProps.CurrentRegion,
    DrawerChange: ReduxProps.ShowDrawer,
    CurrentVector: ReduxProps.CurrentVector,
  };
};
const mapDispatchToProps = (dispatch) => {
  return {
    showDrawer: (val) => dispatch({ type: "SHOWDRAWER" }),
    hideDrawer: (val) => dispatch({ type: "HIDEDRAWER" }),
  };
};
const key = "updatable";

const openNotification = () => {
  notification.open({
    key,
    // message: 'Notification Title',
    description: "Trend data is not available for given time range !",
    icon: <InfoCircleTwoTone />,
  });
};
class DrawerModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      centerpoint: [77.74593740335436, 17.25474880524307],
      properties: [],
      visible: false,
      // area: props.district.area,
      modal: false,
      selected_shape: geojson,
      loader: false,
      selectedLULCcategory: "Water",
      populationData: "0.00",
      LULCtrend: [],
      customStatus: false,
      currentCharttime: "6mon",
      customLULC: [],
      tableKey: 0,
      currentWeatherRange: "6months",
      LULCclasses: [],
      options: {
        colors: ["#d65522"],
        chart: {
          id: "trendChart",
          type: "area",
          height: 140,
          width: 316,
          zoom: {
            autoScaleYaxis: true,
          },
          toolbar: {
            show: true,
            export: {
              csv: {
                headerCategory: "Datetime",
              },
              svg: {
                show: false,
              },
              png: {
                show: false,
              },
            },
            tools: {
              download: true,
              selection: false,
              zoom: false,
              zoomin: false,
              zoomout: false,
              pan: false,
              reset: false,
            },
          },
        },
        dataLabels: {
          enabled: false,
        },
        markers: {
          size: 0,
          style: "hollow",
        },
        grid: {
          show: false,
        },
        yaxis: {
          show: false,
          min: -1.0,
        },
        xaxis: {
          type: "datetime",
          tickAmount: 6,
        },
        tooltip: {
          x: {
            format: "dd MMM yyyy",
          },
        },
        fill: {
          colors: ["#1A73E8"],
        },
        stroke: {
          show: true,
          curve: "straight",
          lineCap: "butt",
          colors: undefined,
          width: 2,
          dashArray: 0,
        },
      },
      series: [
        {
          name: "Trend",
          data: [
            { x: 1615362718000, y: 77.95 },
            { x: 1615363619000, y: 90.34 },
            { x: 1615364518000, y: 24.18 },
            { x: 1615365418000, y: 21.05 },
            { x: 1615366318000, y: 71.0 },
            { x: 1615367218000, y: 80.95 },
          ],
        },
      ],
      from_date: "2021-06-10",
      to_date: "2021-12-12",
      selectedWeatherparams: "max_temp",
      last_updated: "",
      weatherValue: 0.0,
    };
    this.showDrawer = this.showDrawer.bind(this);
    this.onClose = this.onClose.bind(this);
    this.gettrendchart = this.gettrendchart.bind(this);
    this.toggleDownload = this.toggleDownload.bind(this);
    this.onClickParameter = this.onClickParameter.bind(this);
    this.onClickCategory = this.onClickCategory.bind(this);
  }
  async getWeathertrend(range) {
    var bodyParams = {};
    if (range == "6months") {
      bodyParams = {
        district: this.props.district.selectedRegion,
        mandal:
          this.props.district.selected_shape.features[0].properties.Mandal_Nam,
        parameter: this.state.selectedWeatherparams,
        start_date: "2021-07-01",
        end_date: "2022-12-31",
      };
      this.setState({
        currentWeatherRange: "6months",
      });
    }

    if (range == "1Year") {
      bodyParams = {
        district: this.props.district.selectedRegion,
        mandal:
          this.props.district.selected_shape.features[0].properties.Mandal_Nam,
        parameter: this.state.selectedWeatherparams,
        start_date: "2021-01-01",
        end_date: "2022-12-31",
      };
      this.setState({
        currentWeatherRange: "1Year",
      });
    }

    try {
      const resWeatherData = await axiosConfig.post(`/getweather?`, bodyParams);
      console.log("RESPONSE ERE", resWeatherData);
      if (resWeatherData.data.trend.length > 0) {
        var last_date = resWeatherData.data.trend.length;
        last_date = last_date - 1;
        last_date = resWeatherData.data.trend[last_date];
        this.timeConverter(last_date[0]);
        this.generatechart(resWeatherData.data.trend);
      } else {
        openNotification();
        this.setState({
          series: [],
          loader: false,
        });
      }
    } catch (err) {
      message.error("Failed to connect to server");
    }
  }
  onClickParameter({ key }) {
    this.setState(
      {
        loader: true,
        selectedWeatherparams: key,
      },
      () => {
        this.getWeathertrend("6months");
      }
    );
  }
  onClickCategory({ key }) {
    this.setState(
      {
        loader: true,
        selectedLULCcategory: this.state.LULCclasses[key],
      },
      () => {
        this.generatechart(this.state.LULCtrend[Number(key)]);
      }
    );
  }
  showDrawer() {
    this.props.showDrawer();
    this.setNewshape();
  }
  onClose() {
    // this.setState({
    //   visible: false,
    // });
    this.props.hideDrawer();
    // dispatch({ type: "HIDEDRAWER"});
  }
  toggleDownload() {
    this.setState({
      modal: !this.state.modal,
    });
  }

  async getLULC() {
    this.setState({
      customLULC: [],
      loader: true,
    });
    var shapeparams = this.props.district.selected_shape;
    shapeparams = shapeparams.features[0].geometry;
    console.log("CUSTOM SHAPE", shapeparams);
    var bodyParams = {
      geojson: shapeparams,
    };
    try {
      const res = await axiosConfig.post(`/getlulcareapercentage?`, bodyParams);
      console.log("LULC DETAILS", res);
      this.setState(
        {
          customLULC: res.data.data,
          loader: false,
          LULCtrend: res.data.trend,
          LULCclasses: res.data.classes,
        },
        () => {
          this.generatechart(res.data.trend[1]);
        }
      );
    } catch (err) {
      message.error("Failed to connect to server");
    }
  }
  async getCUSTOMLULC(geojson) {
    this.setState({
      customLULC: [],
      loader: true,
    });
    var shapeparams = geojson;
    shapeparams = shapeparams.features[0].geometry;
    console.log("CUSTOM SHAPE", shapeparams);
    var bodyParams = {
      geojson: shapeparams,
    };
    try {
      const res = await axiosConfig.post(`/getlulcareapercentage?`, bodyParams);
      console.log("LULC DETAILS", res);
      this.setState(
        {
          customLULC: res.data.data,
          loader: false,
          LULCtrend: res.data.trend,
          LULCclasses: res.data.classes,
        },
        () => {
          this.generatechart(res.data.trend[1]);
        }
      );
    } catch (err) {
      message.error("Failed to connect to server");
    }
  }
  async gettrendchart() {
    this.setState({
      loader: true,
    });

    var shapeparams = this.props.district.selected_shape;
    shapeparams = shapeparams.features[0].geometry;
    var bodyParams = {};
    if (this.props.CurrentLayer == "POPULATION") {
      bodyParams = {
        geojson: shapeparams,
        // startdate: this.state.from_date,
        // enddate: this.state.to_date,
        startdate: "2000-01-01",
        enddate: "2022-04-05",
        parameter: this.props.CurrentLayer,
      };
    } else {
      bodyParams = {
        geojson: shapeparams,
        startdate: this.state.from_date,
        enddate: this.state.to_date,
        // startdate: "2000-01-01",
        // enddate: "2022-04-05",
        parameter: this.props.CurrentLayer,
      };
    }

    try {
      const res = await axiosConfig.post(`/gettrend?`, bodyParams);
      if (res.data.code == 404) {
        openNotification();
        this.setState({
          series: [],
          loader: false,
        });
      } else {
        this.generatechart(res.data.trend);
      }
    } catch (err) {
      message.error("Failed to connect to server");
    }
    this.getPopulation(shapeparams);
  }
  async getPopulation(shapeparams) {
    // =====================API FOR POPULATION DATA=================
    var bodyParamsPopulation = {
      geojson: shapeparams,
      date: "2020-01-01",
      parameter: "POPULATION",
    };
    try {
      const resPopulation = await axiosConfig.post(
        `/getzstat?`,
        bodyParamsPopulation
      );
      this.setState({
        populationData: resPopulation.data.stat.mean,
      });
    } catch (err) {
      message.error("Failed to connect to server");
    }
  }
  generatechart(data) {
    let chart_values = [];
    var trendData = {
      name: this.props.CurrentLayer,
      data: [],
    };
    if (this.props.CurrentLayer == "LULC") {
      this.setState({
        options: {
          colors: ["#d65522"],
          chart: {
            id: "trendChart",
            type: "area",
            height: 140,
            width: 316,
            zoom: {
              autoScaleYaxis: true,
            },
            toolbar: {
              show: true,
              export: {
                csv: {
                  headerCategory: "Datetime",
                },
                svg: {
                  show: false,
                },
                png: {
                  show: false,
                },
              },
              tools: {
                download: true,
                selection: false,
                zoom: false,
                zoomin: false,
                zoomout: false,
                pan: false,
                reset: false,
              },
            },
          },
          dataLabels: {
            enabled: false,
          },
          markers: {
            size: 0,
            style: "hollow",
          },
          grid: {
            show: false,
          },
          yaxis: {
            show: false,
            min: -1.0,
          },
          xaxis: {
            type: "datetime",
            // tickAmount: 6,
            labels: {
              format: "yyyy",
            },
          },
          tooltip: {
            x: {
              format: "yyyy",
            },
          },
          fill: {
            colors: ["#1A73E8"],
          },
          stroke: {
            show: true,
            curve: "straight",
            lineCap: "butt",
            colors: undefined,
            width: 2,
            dashArray: 0,
          },
        },
   
      });
    } else {
      this.setState({
        options: {
          tooltip: {
            x: {
              format: "dd MMM yyyy",
            },
          },
        },
      });
    }
    if (data != null) {
      data.map(function (item, index, data) {
        if(item[1]!=null){
          trendData.data.push({
            x: item[0],
            y: parseFloat(item[1]).toFixed(2),
          });
        }
    
      });
    }
    var trendlength = trendData.data.length;
    var lst_value = trendData.data[trendlength - 1];
    lst_value = lst_value.y;
    console.log("UPDAET VALUE", trendData);
    if (trendData.data == null) {
      chart_values = [trendData];
    }
    this.setState({
      series: [trendData],
      loader: false,
      weatherValue: lst_value,
    });

    // return [trendData];
  }
  checkValue(value) {
    if (isNaN(value)) {
      return "0.00";
    } else {
      return value;
    }
  }
  setNewshape() {
    this.setState(
      {
        selected_shape: this.props.district.selected_shape,
      },
      () => {
        {
          // console.log("SELECTED SHAPE", this.state.selected_shape);
        }
      }
    );
  }
  async setPointsChart() {
    var shapeparams = this.props.district.selected_shape;
    shapeparams = shapeparams.features[0].geometry;
    var bodyParams = {
      geojson: shapeparams,
      startdate: this.state.from_date,
      enddate: this.state.to_date,
    };
    try {
      const res = await axiosConfig.post(`/getpointstrend?`, bodyParams);
      if (res.data.code == 404) {
        openNotification();
        this.setState({
          series: [],
          loader: false,
        });
      } else {
        this.generatechart(res.data.trend);
        this.getPopulation(shapeparams);
      }
    } catch (err) {
      message.error("Failed to connect to server");
    }
  }
  settimerange(daterange) {
    if (daterange == "6months") {
      let current_date;
      let from_date;
      current_date = new Date();
      from_date = new Date();
      from_date = from_date.setMonth(from_date.getMonth() - 6);
      from_date = new Date(from_date);
      var from_dd = String(from_date.getDate()).padStart(2, "0");
      var from_mm = String(from_date.getMonth() + 1).padStart(2, "0"); //January is 0!
      var from_yyyy = from_date.getFullYear();
      var start_date = from_yyyy + "-" + from_mm + "-" + from_dd;
      var to_dd = String(current_date.getDate()).padStart(2, "0");
      var to_mm = String(current_date.getMonth() + 1).padStart(2, "0"); //January is 0!
      var to_yyyy = current_date.getFullYear();
      var to_date = to_yyyy + "-" + to_mm + "-" + to_dd;
      console.log("FROM DATE & TO DATE", start_date, to_date);
      if (this.props.CurrentLayer == "FIREEV") {
        this.setState(
          {
            from_date: start_date,
            to_date: to_date,
            currentCharttime: "6mon",
          },
          () => {
            this.setPointsChart();
          }
        );
      } else {
        this.setState(
          {
            from_date: start_date,
            to_date: to_date,
            currentCharttime: "6mon",
          },
          () => {
            this.gettrendchart();
          }
        );
      }
    } else if (daterange == "1Year") {
      let current_date;
      let from_date;
      current_date = new Date();
      from_date = new Date();
      from_date = from_date.setFullYear(from_date.getFullYear() - 1);
      from_date = new Date(from_date);
      var from_dd = String(from_date.getDate()).padStart(2, "0");
      var from_mm = String(from_date.getMonth() + 1).padStart(2, "0"); //January is 0!
      var from_yyyy = from_date.getFullYear();
      var start_date = from_yyyy + "-" + from_mm + "-" + from_dd;
      var to_dd = String(current_date.getDate()).padStart(2, "0");
      var to_mm = String(current_date.getMonth() + 1).padStart(2, "0"); //January is 0!
      var to_yyyy = current_date.getFullYear();
      var to_date = to_yyyy + "-" + to_mm + "-" + to_dd;
      if (this.props.CurrentLayer == "FIREEV") {
        this.setState(
          {
            from_date: start_date,
            to_date: to_date,
            currentCharttime: "1year",
          },
          () => {
            this.setPointsChart();
          }
        );
      } else {
        this.setState(
          {
            from_date: start_date,
            to_date: to_date,
            currentCharttime: "1year",
          },
          () => {
            this.gettrendchart();
          }
        );
      }
    } else if (daterange == "3Year") {
      let current_date;
      let from_date;
      current_date = new Date();
      from_date = new Date();
      from_date = from_date.setFullYear(from_date.getFullYear() - 3);
      from_date = new Date(from_date);
      var from_dd = String(from_date.getDate()).padStart(2, "0");
      var from_mm = String(from_date.getMonth() + 1).padStart(2, "0"); //January is 0!
      var from_yyyy = from_date.getFullYear();
      var start_date = from_yyyy + "-" + from_mm + "-" + from_dd;
      var to_dd = String(current_date.getDate()).padStart(2, "0");
      var to_mm = String(current_date.getMonth() + 1).padStart(2, "0"); //January is 0!
      var to_yyyy = current_date.getFullYear();
      var to_date = to_yyyy + "-" + to_mm + "-" + to_dd;

      if (this.props.CurrentLayer == "FIREEV") {
        this.setState(
          {
            from_date: start_date,
            to_date: to_date,
            currentCharttime: "3year",
          },
          () => {
            this.setPointsChart();
          }
        );
      } else {
        this.setState(
          {
            from_date: start_date,
            to_date: to_date,
            currentCharttime: "3year",
          },
          () => {
            this.gettrendchart();
          }
        );
      }
    } else if (daterange == "5Year") {
      let current_date;
      let from_date;
      current_date = new Date();
      from_date = new Date();
      from_date = from_date.setFullYear(from_date.getFullYear() - 5);
      from_date = new Date(from_date);
      var from_dd = String(from_date.getDate()).padStart(2, "0");
      var from_mm = String(from_date.getMonth() + 1).padStart(2, "0"); //January is 0!
      var from_yyyy = from_date.getFullYear();
      var start_date = from_yyyy + "-" + from_mm + "-" + from_dd;
      var to_dd = String(current_date.getDate()).padStart(2, "0");
      var to_mm = String(current_date.getMonth() + 1).padStart(2, "0"); //January is 0!
      var to_yyyy = current_date.getFullYear();
      var to_date = to_yyyy + "-" + to_mm + "-" + to_dd;
      if (this.props.CurrentLayer == "FIREEV") {
        this.setState(
          {
            from_date: start_date,
            to_date: to_date,
            currentCharttime: "5year",
          },
          () => {
            this.setPointsChart();
          }
        );
      } else {
        this.setState(
          {
            from_date: start_date,
            to_date: to_date,
            currentCharttime: "5year",
          },
          () => {
            this.gettrendchart();
          }
        );
      }
    }
  }
  timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp);
    // var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    // var year = a.getFullYear();
    // var month = months[a.getMonth()];
    // var date = a.getDate();
    // var hour = a.getHours();
    // var min = a.getMinutes();
    // var sec = a.getSeconds();
    // var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    var dd = String(a.getDate()).padStart(2, "0");
    var mm = String(a.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = a.getFullYear();
    var date = yyyy + "-" + mm + "-" + dd;
    // return time;
    this.setState({
      last_updated: date,
    });
  }
  spellPerilcheck(peril) {
    if (peril == "rain") {
      return "Rainfall";
    }
    if (peril == "min_temp") {
      return "Minimum Temperature";
    }
    if (peril == "max_temp") {
      return "Maximum Temperature";
    }
    if (peril == "min_humidity") {
      return "Minimum Humidity";
    }
    if (peril == "max_humidity") {
      return "Maximum Humidity";
    }
    if (peril == "min_wind_speed") {
      return "Minimum Wind Speed";
    }
    if (peril == "max_wind_speed") {
      return "Max Wind Speed";
    }
  }
  checkDefined(value, date, category) {
    if (value[date] == undefined) {
      return "0.00";
    } else {
      console.log("LULC VALUES", value[date][category]);
      // this.setState({
      //   tableKey:this.state.tableKey+1
      // })
      if (value[date].hasOwnProperty(category)) {
        return parseFloat(value[date][category]).toFixed(2);
      }
    }
  }
  render() {
    const menu = (
      <Menu onClick={this.onClickParameter}>
        <Menu.Item key="max_temp">Maximum Temperature</Menu.Item>
        <Menu.Item key="min_temp">Minimum Temperature</Menu.Item>
        <Menu.Item key="rain">Rainfall</Menu.Item>
        <Menu.Item key="min_humidity">Minimum Humidity</Menu.Item>
        <Menu.Item key="max_humidity">Maximum Humidity</Menu.Item>
        <Menu.Item key="min_wind_speed">Minimum Wind Speed</Menu.Item>
        <Menu.Item key="max_wind_speed">Maximum Wind Speed</Menu.Item>
      </Menu>
    );
    const LULCmenu = (
      <Menu onClick={this.onClickCategory}>
        <Menu.Item key="1">Water</Menu.Item>
        <Menu.Item key="2">Trees</Menu.Item>
        <Menu.Item key="4">Flooded vegetation</Menu.Item>
        <Menu.Item key="5">Crops</Menu.Item>
        <Menu.Item key="7">Built Area</Menu.Item>
        <Menu.Item key="8">Bare ground</Menu.Item>
        <Menu.Item key="9">Snow/Ice</Menu.Item>
        <Menu.Item key="10">Clouds</Menu.Item>
        <Menu.Item key="11">Rangeland</Menu.Item>
      </Menu>
    );
    var PROJECTION_CONFIG = [];
    var projection = [];
    console.log("CURRENT REEIOGN IN DRAWER", this.props.CurrentRegion);
    if (this.props.CurrentLayer != "CP") {
      const width = 800;
      const height = width * 0.9;
      projection = geoMercator().fitExtent(
        [
          [0, 0],
          [width * 0.7, height * 0.7],
        ],
        this.state.selected_shape
      );
      const path = geoPath().projection(projection);
      const centerpoint =
        this.state.selected_shape.features[0].properties.centroid;
      var scaleValue;
      if (this.props.district.area < 0.001) {
        scaleValue = 20000000;
      } else if (
        this.props.district.area >= 0.001 &&
        this.props.district.area <= 0.1
      ) {
        scaleValue = 15000000;
      } else if (
        this.props.district.area >= 1 &&
        this.props.district.area <= 50
      ) {
        scaleValue = 250000;
      } else if (
        this.props.district.area >= 50 &&
        this.props.district.area <= 100
      ) {
        scaleValue = 200000;
      } else if (
        this.props.district.area >= 100 &&
        this.props.district.area <= 200
      ) {
        scaleValue = 100000;
      } else if (
        this.props.district.area >= 200 &&
        this.props.district.area <= 300
      ) {
        scaleValue = 80000;
      } else if (
        this.props.district.area >= 300 &&
        this.props.district.area <= 400
      ) {
        scaleValue = 70000;
      } else if (
        this.props.district.area >= 400 &&
        this.props.district.area <= 500
      ) {
        scaleValue = 60000;
      } else if (
        this.props.district.area >= 500 &&
        this.props.district.area <= 800
      ) {
        scaleValue = 50000;
      } else if (
        this.props.district.area >= 1000 &&
        this.props.district.area <= 2000
      ) {
        scaleValue = 40000;
      } else {
        scaleValue = 25000;
      }
      PROJECTION_CONFIG = {
        scale: scaleValue,
        center: centerpoint,
      };
    }

    return (
      <div>
        <Drawer
          // title={this.props.LayerDescription.layer_name}
          placement="right"
          onClose={this.onClose}
          visible={this.props.DrawerChange}
          maskClosable={false}
          mask={false}
          closable={false}
          width={450}
          // extra={
          //   <Space>
          //     <BiX className="drawer-close" onClick={this.onClose} />
          //   </Space>
          // }
        >
          <Col>
            <div className="col" style={{ textAlign: "right" }}>
              <BiX className="drawer-close" onClick={this.onClose} />
            </div>
            <Card style={{ backgroundColor: "#032e4e", marginBottom: "15px" }}>
              <CardBody>
                <Row>
                  <Col
                    style={
                      this.props.CurrentRegion == "CUSTOM"
                        ? { display: "none" }
                        : {}
                    }
                    md={4}
                    className="customdraw"
                  >
                    <div>
                      <ComposableMap
                        projectionConfig={PROJECTION_CONFIG}
                        projection="geoMercator"
                        width={600}
                        height={600}
                      >
                        <Geographies
                          geography={this.state.selected_shape.features}
                        >
                          {({ geographies }) =>
                            geographies.map((geo) => (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="#032e4e"
                                stroke="#fff"
                                strokeWidth="1"
                              />
                            ))
                          }
                        </Geographies>
                      </ComposableMap>
                    </div>
                  </Col>

                  {/* custom draw */}
                  <Col
                    style={
                      this.props.CurrentRegion == "CUSTOM"
                        ? {}
                        : { display: "none" }
                    }
                    md={4}
                    className="customdraw"
                  >
                    <ComposableMap
                      projectionConfig={PROJECTION_CONFIG}
                      projection={projection}
                      width={600}
                      height={600}
                    >
                      <Geographies
                        geography={this.state.selected_shape.features}
                        disableOptimization
                      >
                        {({ geographies }) =>
                          geographies.map((geo) => (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill="#032e4e"
                              stroke="#fff"
                              strokeWidth="1"
                            />
                          ))
                        }
                      </Geographies>
                    </ComposableMap>
                  </Col>
                  <Col md={8}>
                    <Row style={{ fontSize: "14px", marginBottom: "-2px" }}>
                      <p style={{ marginBottom: "-2px", textAlign: "right" }}>
                        {this.props.CurrentRegion}
                      </p>
                    </Row>
                    <Row style={{ fontSize: "18px", color: "#fff" }}>
                      <p style={{ marginBottom: "20px", textAlign: "right" }}>
                        {this.props.district.selectedRegion}
                      </p>
                    </Row>
                    <Row>
                      <p style={{ marginBottom: "-2px", textAlign: "right" }}>
                        AREA
                      </p>
                    </Row>
                    <Row style={{ color: "#fff" }}>
                      <p
                        style={{
                          marginBottom: "-2px",
                          textAlign: "right",
                          fontSize: "18px",
                        }}
                      >
                        {this.props.district.area} (&#13218;)
                      </p>
                    </Row>
                  </Col>
                </Row>
              </CardBody>
            </Card>
            {/* <hr /> */}
            <Row>
              <Col>
                <div>
                  <p style={{ fontSize: "18px", display: "inline" }}>
                    <BiLayer /> {this.props.LayerDescription.display_name}
                  </p>
                </div>
              </Col>
              <Col
                style={
                  this.props.CurrentLayer == "WEATHER" ||
                  this.props.CurrentLayer == "LULC"
                    ? { display: "none" }
                    : {}
                }
                className="alignrignt"
              >
                <p style={{ fontSize: "18px", marginBottom: "15px" }}>
                  {this.props.LayerDescription.last_updated.slice(0, 10)}
                </p>
              </Col>
              <Col
                style={
                  this.props.CurrentLayer == "WEATHER"
                    ? {}
                    : { display: "none" }
                }
                className="alignrignt"
              >
                <p style={{ fontSize: "18px", marginBottom: "0px" }}>
                  {this.state.last_updated}
                </p>
              </Col>
            </Row>
            <Row>
              <Col>
                <span
                  style={{ display: "inline", "margin-left": "10px" }}
                  style={
                    this.props.CurrentLayer == "WEATHER"
                      ? {}
                      : { display: "none" }
                  }
                >
                  <Dropdown overlay={menu}>
                    <a
                      className="ant-dropdown-link"
                      onClick={(e) => e.preventDefault()}
                    >
                      Select Parameter <DownOutlined /> |{" "}
                      {this.spellPerilcheck(this.state.selectedWeatherparams)}
                    </a>
                  </Dropdown>
                </span>
              </Col>
            </Row>
            <Row>
              <Col
                style={
                  this.props.CurrentLayer == "LULC" ? { display: "none" } : {}
                }
              >
                <div>
                  {this.checkValue(this.props.district.areaValue) > 200 ? (
                    <p
                      style={{
                        fontSize: "27px",
                        fontWeight: "lighter",
                        color: "#fff",
                      }}
                    >
                      {this.props.CurrentLayer == "WEATHER"
                        ? this.state.weatherValue
                        : this.checkValue(this.props.district.areaValue)}
                      <p
                        style={{
                          fontSize: "15px",
                          fontWeight: "lighter",
                          color: "#fff",
                        }}
                      >
                        {this.props.LayerDescription.unit}
                      </p>
                    </p>
                  ) : (
                    <p
                      style={{
                        fontSize: "35px",
                        fontWeight: "lighter",
                        color: "#fff",
                      }}
                    >
                      {this.props.CurrentLayer == "WEATHER"
                        ? this.state.weatherValue
                        : this.checkValue(this.props.district.areaValue)}
                      <p
                        style={{
                          fontSize: "15px",
                          fontWeight: "lighter",
                          color: "#fff",
                        }}
                      >
                        {this.props.LayerDescription.unit}
                      </p>
                    </p>
                  )}
                </div>
              </Col>

              <Col
                style={{ paddingLeft: "0px", paddingTop: "20px" }}
                style={
                  this.props.CurrentLayer == "FIREEV" ||
                  this.props.CurrentLayer == "WEATHER" ||
                  this.props.CurrentLayer == "LULC"
                    ? { display: "none" }
                    : {}
                }
              >
                <Row>
                  <Col className="steps-min">
                    {" "}
                    {this.checkValue(this.props.district.minVal)}
                  </Col>
                  <Col className="steps-avg">
                    {this.checkValue(this.props.district.areaValue)}
                  </Col>
                  <Col className="steps-max">
                    {this.checkValue(this.props.district.maxVal)}
                  </Col>
                </Row>
                <Row>
                <ol class="progress-indicator mb-2">
                  <li class="is-complete" data-step="">
                  <span>Min</span>
                  </li>
                  <li class="is-complete" data-step="">
                  <span>Avg</span>
                  </li>
                  <li class="is-complete" data-step="">
                  <span>Max</span>
                  </li>
                </ol>
                </Row>
              </Col>
            </Row>
            <Row>
              <p style={{ fontSize: "15px", fontWeight: "lighter" }}>
                {this.props.LayerDescription.long_description}
              </p>
              <p>Source : {this.props.LayerDescription.source}</p>
              <p>Citation : {this.props.LayerDescription.citation}</p>
              <p>Standards : {this.props.LayerDescription.standards}</p>
            </Row>
            <hr />
            <Col
              md={12}
              style={
                this.props.CurrentLayer == "LULC" ? {} : { display: "none" }
              }
            >
              <div style={this.state.loader ? {} : { display: "none" }}>
                <center>
                  <img
                    src={Loader}
                    alt="Logo"
                    style={{
                      height: "100px",
                      backgroundColor: "transparent",
                    }}
                  />
                </center>
              </div>
              <div style={this.state.loader ? { display: "none" } : {}}>
                <div>
                  <p style={{ fontSize: "18px", display: "inline" }}>
                    <BiLineChart /> Trend
                  </p>
                </div>
                <Row>
                  <Col>
                    <span
                      style={{ display: "inline", "margin-left": "10px" }}
                      style={
                        this.props.CurrentLayer == "LULC"
                          ? {}
                          : { display: "none" }
                      }
                    >
                      <Dropdown overlay={LULCmenu}>
                        <a
                          className="ant-dropdown-link"
                          onClick={(e) => e.preventDefault()}
                        >
                          Select Category <DownOutlined /> |{" "}
                          {this.state.selectedLULCcategory}
                        </a>
                      </Dropdown>
                    </span>
                  </Col>
                </Row>
                <div class="col-md-12"></div>
                <div style={this.state.loader ? { display: "none" } : {}}>
                  <Chart
                    series={this.state.series}
                    options={this.state.options}
                    type="line"
                    height="140"
                  />
                </div>
              </div>
            </Col>
            <Row
              style={
                this.props.LayerDescription.multiple_files
                  ? {}
                  : { display: "none" }
              }
            >
              <div>
                <p style={{ fontSize: "18px", display: "inline" }}>
                  <BiLineChart /> Trend
                </p>
              </div>
              {/* =================================WEATHER DATA TREND-START======================================== */}
              <div
                className="btn-group-sm"
                role="group"
                aria-label="Basic radio toggle button group"
                style={{ fontSize: "10px", marginTop: "10px" }}
                style={
                  this.props.CurrentLayer == "WEATHER"
                    ? {}
                    : { display: "none" }
                }
               
              >
                <input
                  type="radio"
                  class="btn-check"
                  name="btnradio"
                  id="btnradio1"
                  autocomplete="off"
                  defaultChecked
                  style={
                    this.props.CurrentLayer == "WEATHER"
                      ? {}
                      : { display: "none" }
                  }
                  checked={
                    this.state.currentWeatherRange == "6months" ? true : false
                  }
                />
                <label
                  class="btn btn-primary btn-chart"
                  for="btnradio1"
                  onClick={(e) => {
                    {
                      this.getWeathertrend("6months");
                    }
                  }}
                >
                  6 months
                </label>
                <input
                  type="radio"
                  className="btn-check"
                  name="btnradio"
                  id="btnradio2"
                  autocomplete="off"
                  style={
                    this.props.CurrentLayer == "WEATHER"
                      ? {}
                      : { display: "none" }
                  }
                  checked={
                    this.state.currentWeatherRange == "1Year" ? true : false
                  }
                />
                <label
                  class="btn btn-primary btn-chart"
                  for="btnradio2"
                  onClick={(e) => {
                    {
                      this.getWeathertrend("1Year");
                    }
                  }}
                >
                  1 year
                </label>
              </div>
              {/* =================================WEATHER DATA TREND-END======================================== */}
              <div
                className="btn-group-sm"
                role="group"
                aria-label="Basic radio toggle button group"
                style={{ fontSize: "10px", marginTop: "10px" }}
                style={
                  this.props.LayerDescription.timerangefilter
                    ? {}
                    : { display: "none" }
                }
              >
                <input
                  type="radio"
                  className="btn-check"
                  name="btnradio"
                  id="btnradio2"
                  autocomplete="off"
                  style={
                    this.props.CurrentLayer == "WEATHER"
                      ? { display: "none" }
                      : {}
                  }
                  checked={
                    this.state.currentCharttime == "1year" ? true : false
                  }
                />
                <label
                  class="btn btn-primary btn-chart"
                  for="btnradio2"
                  style={
                    this.props.CurrentLayer == "WEATHER"
                      ? { display: "none" }
                      : {}
                  }
                  onClick={(e) => {
                    {
                      this.settimerange("1Year");
                    }
                  }}
                >
                  1 year
                </label>
                <input
                  type="radio"
                  className="btn-check"
                  name="btnradio"
                  id="btnradio3"
                  autocomplete="off"
                  style={
                    this.props.CurrentLayer == "WEATHER"
                      ? { display: "none" }
                      : {}
                  }
                  checked={
                    this.state.currentCharttime == "3year" ? true : false
                  }
                />
                <label
                  class="btn btn-primary btn-chart"
                  for="btnradio3"
                  style={
                    this.props.CurrentLayer == "WEATHER"
                      ? { display: "none" }
                      : {}
                  }
                  onClick={(e) => {
                    {
                      this.settimerange("3Year");
                    }
                  }}
                >
                  3 year
                </label>
                <input
                  type="radio"
                  className="btn-check"
                  name="btnradio"
                  id="btnradio4"
                  style={
                    this.props.CurrentLayer == "WEATHER"
                      ? { display: "none" }
                      : {}
                  }
                  autocomplete="off"
                  checked={
                    this.state.currentCharttime == "5year" ? true : false
                  }
                />
                <label
                  class="btn btn-primary btn-chart"
                  for="btnradio4"
                  style={
                    this.props.CurrentLayer == "WEATHER"
                      ? { display: "none" }
                      : {}
                  }
                  onClick={(e) => {
                    {
                      this.settimerange("5Year");
                    }
                  }}
                >
                  5 year
                </label>
              </div>
              <div style={this.state.loader ? {} : { display: "none" }}>
                <center>
                  <img
                    src={Loader}
                    alt="Logo"
                    style={{
                      height: "100px",
                      backgroundColor: "transparent",
                    }}
                  />
                </center>
              </div>

              <div style={this.state.loader ? { display: "none" } : {}}>
                <Chart
                  series={this.state.series}
                  options={this.state.options}
                  type="line"
                  height="140"
                />
              </div>
            </Row>
            {/* <Row>
              <Col md={12}>
                <Button style={{ float: "right" }}>Download</Button>
              </Col>
            </Row> */}
          </Col>
        </Drawer>
        <Modal
          isOpen={this.state.modal}
          toggle={this.toggleDownload}
          className={this.props.className}
          centered
          backdrop="static"
        >
          <ModalHeader toggle={this.toggleDownload}>Download</ModalHeader>
          <ModalBody className="trend-modal">
            <AvForm>
              <div
                style={{
                  maxHeight: "calc(100vh - 290px)",
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
                className="trend-download-content"
              >
                <AvGroup>
                  <Label for="example">Name</Label>
                  <AvInput name="name" id="name" required />
                  <AvFeedback>Please enter your name</AvFeedback>
                </AvGroup>
                <AvGroup>
                  <Label for="example">Email</Label>
                  <AvInput name="email" id="email" required />
                  <AvFeedback>Please enter your email address</AvFeedback>
                </AvGroup>
                <Label>USAGE TYPE</Label>
                <AvRadioGroup
                  name="radioExample"
                  required
                  errorMessage="Pick one!"
                >
                  <Row>
                    <Col>
                      <AvRadio label="Commercial" value="commercial" />
                    </Col>
                    <Col>
                      <AvRadio label="Non-commercial" value="non-commercial" />
                    </Col>
                  </Row>
                </AvRadioGroup>

                <AvField type="select" name="select" label="Purpose">
                  <option value="" selected disabled>
                    Purpose
                  </option>
                  <option>Academia</option>
                  <option>Business</option>
                  <option>Government Use</option>
                  <option>R&D</option>
                  <option>Journalistic</option>
                  <option>Others</option>
                </AvField>
                <div className="captcha">
                  <Captcha
                    onChange={this.onChange}
                    placeholder="Enter captcha"
                  />
                </div>
              </div>
              <ModalFooter>
                <Button color="secondary">Download</Button>
              </ModalFooter>
            </AvForm>
          </ModalBody>
        </Modal>
      </div>
    );
  }
}
export default connect(mapStateToProps, mapDispatchToProps, null, {
  forwardRef: true,
})(DrawerModal);