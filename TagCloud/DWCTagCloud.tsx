import * as React from "react";
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';

initializeIcons();

import TagCloud from 'react-tag-cloud';

export interface IDwcCloudTag {
  tagName: string;
  recordId: string;
  tagSize: number;
  numberAttr: number;
}

export interface IDwcTagCloudProps {
  tags: IDwcCloudTag[];
  animation: boolean;
  animationTime: number;
  loadMore: Function;
  recordsLoaded: boolean;
  openRecord: Function;
}

interface IDwcTagCloudState {
  tags: IDwcCloudTag[];
}

export class DwcCloud extends React.Component<IDwcTagCloudProps, IDwcTagCloudState> {

  componentDidMount() {
    if (this.props.animation) {
      setInterval(() => {
        this.forceUpdate();
      }, this.props.animationTime);
    }
  }

  render() {
    const tagItems = this.props.tags.map((tagInfo) =>
      <div key={tagInfo.recordId} 
           style={{ fontSize: tagInfo.tagSize, cursor: 'pointer' }}
           onClick={(e) => this.props.openRecord(tagInfo.recordId, e)}>{tagInfo.tagName}</div>
    );
    return (
      <div>
        <CommandBar
          items={[]}
          farItems={[
            {
              key: 'loadmore',
              name: 'Load More',
              iconProps: {
                iconName: 'Download'
              },
              onClick: () => this.props.loadMore(),
              disabled: this.props.recordsLoaded
            }
          ]}
          ariaLabel={'Use left and right arrow keys to navigate between commands'}
        />
        <div style={{ height: '400px', width: '400px', display: 'flex' }}>
          <TagCloud style={{
            fontFamily: 'sans-serif',
            fontSize: 30,
            fontWeight: 'bold',
            fontStyle: 'italic',
            color: '#98FB98',
            padding: 5
          }} className='tag-cloud'>
            {tagItems}
          </TagCloud>
        </div>
      </div>
    );
  }
}