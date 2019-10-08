import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import DataSetInterfaces = ComponentFramework.PropertyHelper.DataSetApi;
import { DwcCloud, IDwcTagCloudProps, IDwcCloudTag } from './DWCTagCloud';
import { number } from "prop-types";

type DataSet = ComponentFramework.PropertyTypes.DataSet;

export class TagCloud implements ComponentFramework.StandardControl<IInputs, IOutputs> {
	private notifyOutputChanged: () => void;
	private _container: HTMLDivElement;
	private _context: ComponentFramework.Context<IInputs>;
	private props: IDwcTagCloudProps;
	private enableTagSize: boolean;
	private enableAnimation: boolean;
	private animationTime: number;
	private minSize: number;
	private maxSize: number;
	/**
	 * Empty constructor.
	 */
	constructor() {

	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
		this.notifyOutputChanged = notifyOutputChanged;
		this._context = context;
		this._container = document.createElement('div');

		this.getDataFromDataSet = this.getDataFromDataSet.bind(this);
		this.adjustSize = this.adjustSize.bind(this);
		this.loadMoreRecords = this.loadMoreRecords.bind(this);
		this.openRecord = this.openRecord.bind(this);

		container.append(this._container);

		this.enableTagSize = context.parameters.EnableTagSize.raw == 1;

		this.enableAnimation = context.parameters.EnableAnimation.raw == 1;

		this.maxSize = 50;

		if (context.parameters.MaxSize.raw != null && context.parameters.MaxSize.raw > 0) {
			this.maxSize = context.parameters.MaxSize.raw;
		}

		this.minSize = 20;

		if (context.parameters.MinSize.raw != null && context.parameters.MinSize.raw > 0) {
			this.minSize = context.parameters.MinSize.raw;
		}

		if (this.maxSize < this.minSize) {
			this.maxSize = 50;
			this.minSize = 20;
		}

		this.animationTime = 5000;

		if (context.parameters.ReanimationTime.raw != null && context.parameters.ReanimationTime.raw != 0) {
			this.animationTime = context.parameters.ReanimationTime.raw;
		}

		let dataSet = context.parameters.viewDataSet;

		this.props = {
			tags: [],
			animation: this.enableAnimation,
			animationTime: this.animationTime,
			loadMore: this.loadMoreRecords,
			recordsLoaded: !context.parameters.viewDataSet.paging.hasNextPage,
			openRecord: this.openRecord
		};

		this.getDataFromDataSet(dataSet);

		console.log("props", this.props);

		ReactDOM.render(
			// Create the React component
			React.createElement(
				DwcCloud,
				this.props
			),
			this._container
		);

	}


	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void {
		this._context = context;

		if (!context.parameters.viewDataSet.loading) {
			let dataSet = context.parameters.viewDataSet;

			this.props.recordsLoaded = !context.parameters.viewDataSet.paging.hasNextPage;

			this.getDataFromDataSet(dataSet);

			console.log("props", this.props);

			ReactDOM.render(
				// Create the React component
				React.createElement(
					DwcCloud,
					this.props
				),
				this._container
			);
		}
	}

	public getDataFromDataSet(dataSet: ComponentFramework.PropertyTypes.DataSet): void {
		if (dataSet.sortedRecordIds.length > 0) {
			for (let currentRecordId of dataSet.sortedRecordIds) {
				if (dataSet.records[currentRecordId].getFormattedValue("NameAttribute") != null &&
					dataSet.records[currentRecordId].getFormattedValue("NameAttribute") != "val") {

					let tag: IDwcCloudTag = {
						tagName: dataSet.records[currentRecordId].getFormattedValue("NameAttribute"),
						recordId: dataSet.records[currentRecordId].getRecordId(),
						tagSize: 20,
						numberAttr: 0
					}

					let size = dataSet.records[currentRecordId].getValue("NumberAttribute") as string;
					if (size != null && size != "val" && this.enableTagSize) {
						tag.numberAttr = parseInt(size);
					}

					if (this.props.tags.filter(data => data.recordId == tag.recordId).length == 0) {
						this.props.tags.push(tag);
					}
				}
			}

			if (this.enableTagSize && this.props.tags.length > 0) {

				let maxValObj = this.props.tags.reduce(function (prev, current) {
					return (prev.numberAttr > current.numberAttr) ? prev : current
				});

				let max = maxValObj.numberAttr;

				this.props.tags.forEach((elem) =>
					elem.tagSize = this.adjustSize(this.minSize, this.maxSize, elem.numberAttr, max)
				);
			}
		}
	}

	private adjustSize(minPx: number, maxPx: number, curSize: number, maxSize: number): number {
		let result = Math.trunc((maxPx * curSize) / maxSize);

		return result > minPx ? result : minPx;
	}

	private loadMoreRecords(){
		this._context.parameters.viewDataSet.paging.loadNextPage();
	}

	private openRecord(id:string){
		let entityName:string = this._context.parameters.viewDataSet.getTargetEntityType();

		let entityFormOptions = {
			entityName:  entityName,
			entityId: id
		};
		
		console.log('openRecord', entityFormOptions);

		this._context.navigation.openForm(entityFormOptions);
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs {
		return {};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void {
		// Add code to cleanup control if necessary
	}

}