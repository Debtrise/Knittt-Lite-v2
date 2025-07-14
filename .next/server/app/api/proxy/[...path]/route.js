/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/proxy/[...path]/route";
exports.ids = ["app/api/proxy/[...path]/route"];
exports.modules = {

/***/ "(rsc)/./app/api/proxy/[...path]/route.ts":
/*!******************************************!*\
  !*** ./app/api/proxy/[...path]/route.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n\nconst API_URL = \"http://34.122.156.88:3001/api\" || 0;\nasync function GET(request, { params }) {\n    try {\n        // Reconstruct the path from the path segments\n        const path = params.path.join('/');\n        // Build the target URL\n        const targetUrl = `${API_URL}/${path}`;\n        console.log(`Proxying request to: ${targetUrl}`);\n        // Fetch the resource from the API\n        const response = await fetch(targetUrl, {\n            headers: {\n                // Forward authorization header if present\n                ...request.headers.get('Authorization') ? {\n                    'Authorization': request.headers.get('Authorization')\n                } : {}\n            }\n        });\n        if (!response.ok) {\n            console.error(`Proxy error: ${response.status} ${response.statusText}`);\n            return new next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse(`Proxy error: ${response.statusText}`, {\n                status: response.status\n            });\n        }\n        // Get the response body as an array buffer for binary data like audio\n        const data = await response.arrayBuffer();\n        // Create a new response with the data\n        const proxyResponse = new next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse(data, {\n            status: response.status,\n            statusText: response.statusText\n        });\n        // Copy all headers from the original response\n        response.headers.forEach((value, key)=>{\n            // Skip setting the 'content-encoding' header as it can cause issues\n            if (key.toLowerCase() !== 'content-encoding') {\n                proxyResponse.headers.set(key, value);\n            }\n        });\n        // Ensure proper content type for audio files\n        if (path.endsWith('.mp3')) {\n            proxyResponse.headers.set('Content-Type', 'audio/mpeg');\n        } else if (path.endsWith('.wav')) {\n            proxyResponse.headers.set('Content-Type', 'audio/wav');\n        } else if (path.endsWith('.ogg')) {\n            proxyResponse.headers.set('Content-Type', 'audio/ogg');\n        }\n        return proxyResponse;\n    } catch (error) {\n        console.error('Proxy error:', error);\n        return new next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse('Internal Server Error', {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3Byb3h5L1suLi5wYXRoXS9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7OztBQUF3RDtBQUV4RCxNQUFNQyxVQUFVQywrQkFBK0IsSUFBSSxDQUEyQjtBQUV2RSxlQUFlRyxJQUNwQkMsT0FBb0IsRUFDcEIsRUFBRUMsTUFBTSxFQUFrQztJQUUxQyxJQUFJO1FBQ0YsOENBQThDO1FBQzlDLE1BQU1DLE9BQU9ELE9BQU9DLElBQUksQ0FBQ0MsSUFBSSxDQUFDO1FBRTlCLHVCQUF1QjtRQUN2QixNQUFNQyxZQUFZLEdBQUdULFFBQVEsQ0FBQyxFQUFFTyxNQUFNO1FBQ3RDRyxRQUFRQyxHQUFHLENBQUMsQ0FBQyxxQkFBcUIsRUFBRUYsV0FBVztRQUUvQyxrQ0FBa0M7UUFDbEMsTUFBTUcsV0FBVyxNQUFNQyxNQUFNSixXQUFXO1lBQ3RDSyxTQUFTO2dCQUNQLDBDQUEwQztnQkFDMUMsR0FBSVQsUUFBUVMsT0FBTyxDQUFDQyxHQUFHLENBQUMsbUJBQ3BCO29CQUFFLGlCQUFpQlYsUUFBUVMsT0FBTyxDQUFDQyxHQUFHLENBQUM7Z0JBQWtCLElBQ3pELENBQUMsQ0FBQztZQUNSO1FBQ0Y7UUFFQSxJQUFJLENBQUNILFNBQVNJLEVBQUUsRUFBRTtZQUNoQk4sUUFBUU8sS0FBSyxDQUFDLENBQUMsYUFBYSxFQUFFTCxTQUFTTSxNQUFNLENBQUMsQ0FBQyxFQUFFTixTQUFTTyxVQUFVLEVBQUU7WUFDdEUsT0FBTyxJQUFJcEIscURBQVlBLENBQUMsQ0FBQyxhQUFhLEVBQUVhLFNBQVNPLFVBQVUsRUFBRSxFQUFFO2dCQUM3REQsUUFBUU4sU0FBU00sTUFBTTtZQUN6QjtRQUNGO1FBRUEsc0VBQXNFO1FBQ3RFLE1BQU1FLE9BQU8sTUFBTVIsU0FBU1MsV0FBVztRQUV2QyxzQ0FBc0M7UUFDdEMsTUFBTUMsZ0JBQWdCLElBQUl2QixxREFBWUEsQ0FBQ3FCLE1BQU07WUFDM0NGLFFBQVFOLFNBQVNNLE1BQU07WUFDdkJDLFlBQVlQLFNBQVNPLFVBQVU7UUFDakM7UUFFQSw4Q0FBOEM7UUFDOUNQLFNBQVNFLE9BQU8sQ0FBQ1MsT0FBTyxDQUFDLENBQUNDLE9BQU9DO1lBQy9CLG9FQUFvRTtZQUNwRSxJQUFJQSxJQUFJQyxXQUFXLE9BQU8sb0JBQW9CO2dCQUM1Q0osY0FBY1IsT0FBTyxDQUFDYSxHQUFHLENBQUNGLEtBQUtEO1lBQ2pDO1FBQ0Y7UUFFQSw2Q0FBNkM7UUFDN0MsSUFBSWpCLEtBQUtxQixRQUFRLENBQUMsU0FBUztZQUN6Qk4sY0FBY1IsT0FBTyxDQUFDYSxHQUFHLENBQUMsZ0JBQWdCO1FBQzVDLE9BQU8sSUFBSXBCLEtBQUtxQixRQUFRLENBQUMsU0FBUztZQUNoQ04sY0FBY1IsT0FBTyxDQUFDYSxHQUFHLENBQUMsZ0JBQWdCO1FBQzVDLE9BQU8sSUFBSXBCLEtBQUtxQixRQUFRLENBQUMsU0FBUztZQUNoQ04sY0FBY1IsT0FBTyxDQUFDYSxHQUFHLENBQUMsZ0JBQWdCO1FBQzVDO1FBRUEsT0FBT0w7SUFDVCxFQUFFLE9BQU9MLE9BQU87UUFDZFAsUUFBUU8sS0FBSyxDQUFDLGdCQUFnQkE7UUFDOUIsT0FBTyxJQUFJbEIscURBQVlBLENBQUMseUJBQXlCO1lBQUVtQixRQUFRO1FBQUk7SUFDakU7QUFDRiIsInNvdXJjZXMiOlsiL0FwcGxpY2F0aW9ucy9Lbml0dHQtTGl0ZS12Mi0xL2FwcC9hcGkvcHJveHkvWy4uLnBhdGhdL3JvdXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXF1ZXN0LCBOZXh0UmVzcG9uc2UgfSBmcm9tICduZXh0L3NlcnZlcic7XG5cbmNvbnN0IEFQSV9VUkwgPSBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19BUElfVVJMIHx8ICdodHRwOi8vMzQuMTIyLjE1Ni44ODozMDAxJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChcbiAgcmVxdWVzdDogTmV4dFJlcXVlc3QsXG4gIHsgcGFyYW1zIH06IHsgcGFyYW1zOiB7IHBhdGg6IHN0cmluZ1tdIH0gfVxuKSB7XG4gIHRyeSB7XG4gICAgLy8gUmVjb25zdHJ1Y3QgdGhlIHBhdGggZnJvbSB0aGUgcGF0aCBzZWdtZW50c1xuICAgIGNvbnN0IHBhdGggPSBwYXJhbXMucGF0aC5qb2luKCcvJyk7XG4gICAgXG4gICAgLy8gQnVpbGQgdGhlIHRhcmdldCBVUkxcbiAgICBjb25zdCB0YXJnZXRVcmwgPSBgJHtBUElfVVJMfS8ke3BhdGh9YDtcbiAgICBjb25zb2xlLmxvZyhgUHJveHlpbmcgcmVxdWVzdCB0bzogJHt0YXJnZXRVcmx9YCk7XG4gICAgXG4gICAgLy8gRmV0Y2ggdGhlIHJlc291cmNlIGZyb20gdGhlIEFQSVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godGFyZ2V0VXJsLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIC8vIEZvcndhcmQgYXV0aG9yaXphdGlvbiBoZWFkZXIgaWYgcHJlc2VudFxuICAgICAgICAuLi4ocmVxdWVzdC5oZWFkZXJzLmdldCgnQXV0aG9yaXphdGlvbicpIFxuICAgICAgICAgID8geyAnQXV0aG9yaXphdGlvbic6IHJlcXVlc3QuaGVhZGVycy5nZXQoJ0F1dGhvcml6YXRpb24nKSEgfSBcbiAgICAgICAgICA6IHt9KSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgY29uc29sZS5lcnJvcihgUHJveHkgZXJyb3I6ICR7cmVzcG9uc2Uuc3RhdHVzfSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XG4gICAgICByZXR1cm4gbmV3IE5leHRSZXNwb25zZShgUHJveHkgZXJyb3I6ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gLCB7IFxuICAgICAgICBzdGF0dXM6IHJlc3BvbnNlLnN0YXR1cyBcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBHZXQgdGhlIHJlc3BvbnNlIGJvZHkgYXMgYW4gYXJyYXkgYnVmZmVyIGZvciBiaW5hcnkgZGF0YSBsaWtlIGF1ZGlvXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmFycmF5QnVmZmVyKCk7XG4gICAgXG4gICAgLy8gQ3JlYXRlIGEgbmV3IHJlc3BvbnNlIHdpdGggdGhlIGRhdGFcbiAgICBjb25zdCBwcm94eVJlc3BvbnNlID0gbmV3IE5leHRSZXNwb25zZShkYXRhLCB7XG4gICAgICBzdGF0dXM6IHJlc3BvbnNlLnN0YXR1cyxcbiAgICAgIHN0YXR1c1RleHQ6IHJlc3BvbnNlLnN0YXR1c1RleHQsXG4gICAgfSk7XG4gICAgXG4gICAgLy8gQ29weSBhbGwgaGVhZGVycyBmcm9tIHRoZSBvcmlnaW5hbCByZXNwb25zZVxuICAgIHJlc3BvbnNlLmhlYWRlcnMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgLy8gU2tpcCBzZXR0aW5nIHRoZSAnY29udGVudC1lbmNvZGluZycgaGVhZGVyIGFzIGl0IGNhbiBjYXVzZSBpc3N1ZXNcbiAgICAgIGlmIChrZXkudG9Mb3dlckNhc2UoKSAhPT0gJ2NvbnRlbnQtZW5jb2RpbmcnKSB7XG4gICAgICAgIHByb3h5UmVzcG9uc2UuaGVhZGVycy5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgLy8gRW5zdXJlIHByb3BlciBjb250ZW50IHR5cGUgZm9yIGF1ZGlvIGZpbGVzXG4gICAgaWYgKHBhdGguZW5kc1dpdGgoJy5tcDMnKSkge1xuICAgICAgcHJveHlSZXNwb25zZS5oZWFkZXJzLnNldCgnQ29udGVudC1UeXBlJywgJ2F1ZGlvL21wZWcnKTtcbiAgICB9IGVsc2UgaWYgKHBhdGguZW5kc1dpdGgoJy53YXYnKSkge1xuICAgICAgcHJveHlSZXNwb25zZS5oZWFkZXJzLnNldCgnQ29udGVudC1UeXBlJywgJ2F1ZGlvL3dhdicpO1xuICAgIH0gZWxzZSBpZiAocGF0aC5lbmRzV2l0aCgnLm9nZycpKSB7XG4gICAgICBwcm94eVJlc3BvbnNlLmhlYWRlcnMuc2V0KCdDb250ZW50LVR5cGUnLCAnYXVkaW8vb2dnJyk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBwcm94eVJlc3BvbnNlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1Byb3h5IGVycm9yOicsIGVycm9yKTtcbiAgICByZXR1cm4gbmV3IE5leHRSZXNwb25zZSgnSW50ZXJuYWwgU2VydmVyIEVycm9yJywgeyBzdGF0dXM6IDUwMCB9KTtcbiAgfVxufSAiXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwiQVBJX1VSTCIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19BUElfVVJMIiwiR0VUIiwicmVxdWVzdCIsInBhcmFtcyIsInBhdGgiLCJqb2luIiwidGFyZ2V0VXJsIiwiY29uc29sZSIsImxvZyIsInJlc3BvbnNlIiwiZmV0Y2giLCJoZWFkZXJzIiwiZ2V0Iiwib2siLCJlcnJvciIsInN0YXR1cyIsInN0YXR1c1RleHQiLCJkYXRhIiwiYXJyYXlCdWZmZXIiLCJwcm94eVJlc3BvbnNlIiwiZm9yRWFjaCIsInZhbHVlIiwia2V5IiwidG9Mb3dlckNhc2UiLCJzZXQiLCJlbmRzV2l0aCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/proxy/[...path]/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fproxy%2F%5B...path%5D%2Froute&page=%2Fapi%2Fproxy%2F%5B...path%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fproxy%2F%5B...path%5D%2Froute.ts&appDir=%2FApplications%2FKnittt-Lite-v2-1%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FApplications%2FKnittt-Lite-v2-1&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fproxy%2F%5B...path%5D%2Froute&page=%2Fapi%2Fproxy%2F%5B...path%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fproxy%2F%5B...path%5D%2Froute.ts&appDir=%2FApplications%2FKnittt-Lite-v2-1%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FApplications%2FKnittt-Lite-v2-1&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Applications_Knittt_Lite_v2_1_app_api_proxy_path_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/proxy/[...path]/route.ts */ \"(rsc)/./app/api/proxy/[...path]/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/proxy/[...path]/route\",\n        pathname: \"/api/proxy/[...path]\",\n        filename: \"route\",\n        bundlePath: \"app/api/proxy/[...path]/route\"\n    },\n    resolvedPagePath: \"/Applications/Knittt-Lite-v2-1/app/api/proxy/[...path]/route.ts\",\n    nextConfigOutput,\n    userland: _Applications_Knittt_Lite_v2_1_app_api_proxy_path_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZwcm94eSUyRiU1Qi4uLnBhdGglNUQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRnByb3h5JTJGJTVCLi4ucGF0aCU1RCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRnByb3h5JTJGJTVCLi4ucGF0aCU1RCUyRnJvdXRlLnRzJmFwcERpcj0lMkZBcHBsaWNhdGlvbnMlMkZLbml0dHQtTGl0ZS12Mi0xJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZBcHBsaWNhdGlvbnMlMkZLbml0dHQtTGl0ZS12Mi0xJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUNlO0FBQzVGO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvQXBwbGljYXRpb25zL0tuaXR0dC1MaXRlLXYyLTEvYXBwL2FwaS9wcm94eS9bLi4ucGF0aF0vcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL3Byb3h5L1suLi5wYXRoXS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3Byb3h5L1suLi5wYXRoXVwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvcHJveHkvWy4uLnBhdGhdL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL0FwcGxpY2F0aW9ucy9Lbml0dHQtTGl0ZS12Mi0xL2FwcC9hcGkvcHJveHkvWy4uLnBhdGhdL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fproxy%2F%5B...path%5D%2Froute&page=%2Fapi%2Fproxy%2F%5B...path%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fproxy%2F%5B...path%5D%2Froute.ts&appDir=%2FApplications%2FKnittt-Lite-v2-1%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FApplications%2FKnittt-Lite-v2-1&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fproxy%2F%5B...path%5D%2Froute&page=%2Fapi%2Fproxy%2F%5B...path%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fproxy%2F%5B...path%5D%2Froute.ts&appDir=%2FApplications%2FKnittt-Lite-v2-1%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FApplications%2FKnittt-Lite-v2-1&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();