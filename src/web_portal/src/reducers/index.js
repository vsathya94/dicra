import setplaceReducer from "./setplacename";
import setColorReducer from "./setColorReducer";
import setvalueReducer from "./setvalue";
import setLayerList from "./setLayerReducers";
import setDownloadLayer from "./DownloadLayer";
import setDownloadLayerDate from "./DownloadLayerDate";
import setDownloadLayerRegion from "./DownloadLayerRegion";
import setDownloadLayerType from "./DownloadLayerType";
import setCurrentLayer from "./CurrentLayerReducer";
import setRasterLoader from "./LoaderRasterReducer";
import setVectorLoader from "./LoaderVectorReducer";
import setCurrentVector from "./CurrentVector";
import setCurrentRegion from "./CurrentRegion";
import setKeyMap from "./KeyMapReducer";
import setLayerDesc from "./LayerDescription";
import setDownLayerDesc from "./DownloadLayerDesc";
import drawerChange from "./ShowDrawer";
import changeOpacity from "./RasterOpacity";
import setDownloadFile from "./DownloadFile";
import currentLayerType from "./currentLayerType";
import hoverlatlon from "./setlatlon";
import setDevCFColorReducer from "./setDevCFColorReducer";
import setDevColorReducer from "./setDevColorReducer";
import {combineReducers} from 'redux';

const allReducers=combineReducers({
    setval:setvalueReducer,
    setplace:setplaceReducer,
    Layers:setLayerList,
    DownloadLayer:setDownloadLayer,
    DownloadLayerDate:setDownloadLayerDate,
    DownloadLayerRegion:setDownloadLayerRegion,
    DownloadLayerType:setDownloadLayerType,
    CurrentLayer:setCurrentLayer,
    RasterLoader:setRasterLoader,
    VectorLoader:setVectorLoader,
    CurrentVector:setCurrentVector,
    CurrentRegion:setCurrentRegion,
    MapKey:setKeyMap,
    SetColor:setColorReducer,
    SetDevCFColor:setDevCFColorReducer,
    SetDevColor:setDevColorReducer,
    LayerDescription:setLayerDesc,
    DownloadLayerDesc:setDownLayerDesc,
    ShowDrawer:drawerChange,
    RasterOpacity:changeOpacity,
    DownloadFile:setDownloadFile,
    CurrentLayerType:currentLayerType,
    Hoverlatlon:hoverlatlon,

});
export default allReducers;