
import { SyntheticEvent } from 'react';
import { Popup } from 'semantic-ui-react';
import { FormattedMessage } from 'react-intl';
import InfiniteScroll from 'react-infinite-scroll-component';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { IVersion } from 'interfaces/targeting';
import styles from './index.module.scss';

interface IProps {
  versions: IVersion[];
  hasMore: boolean;
  latestVersion: number;
  selectedVersion: number;
  loadMore(): void;
  reviewHistory(version: IVersion): void;
  setHistoryOpen(open: boolean): void;
}

const History = (props: IProps) => {
  const { versions, hasMore, selectedVersion, latestVersion, loadMore, reviewHistory } = props;

  return (
    <div className={styles.history}>
      <div className={styles['history-title']}>
        <span>
          <FormattedMessage id='common.history.text' />
        </span>
      </div>
      <div className={styles.lists} id='scrollableDiv'>
        <InfiniteScroll
          dataLength={versions.length}
          next={loadMore}
          hasMore={hasMore}
          scrollableTarget='scrollableDiv'
          loader={
            <div className={styles.loading}>
              <FormattedMessage id='common.loading.text' />
            </div>
          }
        >
          {
            versions.length > 0 && versions.map((item: IVersion) => {
              const clsRight = classNames(
                styles['version-right'],
                {
                  [styles['version-right-selected']]: item?.version === Number(selectedVersion)
                }
              );

              const clsCircle = classNames(
                styles.circle,
                {
                  [styles['circle-selected']]: item?.version === Number(selectedVersion)
                }
              );

              const clsVersion = classNames(
                {
                  [styles['version-selected']]: item?.version === Number(selectedVersion)
                }
              );

              const clsVersionText = classNames(
                styles['version-text'],
                {
                  [styles['version-text-selected']]: item?.version === Number(selectedVersion)
                }
              );

              return (
                <div 
                  key={item.version} 
                  className={styles.version} 
                  onClick={(e: SyntheticEvent) => {
                    e.stopPropagation();
                    if (item?.version === Number(selectedVersion)) {
                      return;
                    }
                    reviewHistory(item);
                  }}
                >
                  <div className={styles['version-left']}>
                    <div className={clsCircle}></div>
                  </div>
                  <div className={clsRight}>
                    <div className={styles.title}>
                      <span className={clsVersion}>
                        <FormattedMessage id='common.version.uppercase.text' />:
                      </span>
                      <span className={clsVersionText}>
                        { item.version }
                      </span>
                      {
                        item.version === latestVersion && (
                          <span className={styles.current}>
                            (<FormattedMessage id='common.current.version.text' />)
                          </span>
                        )
                      }
                    </div>
                    <div className={styles.modifyBy}>
                      <span className={styles['version-title']}>
                        <FormattedMessage id='common.modified.by.text' />
                      </span>
                      :
                      { item.createdBy }
                    </div>
                    <div className={styles.modifyTime}>
                      <span className={styles['version-title']}>
                        <FormattedMessage id='common.modified.time.text' />:
                      </span>
                      { dayjs(item?.createdTime).fromNow() }  
                    </div>
                    {
                      item.comment && <div className={styles.comment}>
                        <span className={styles['version-title']}>
                          <FormattedMessage id='targeting.publish.modal.comment' />
                        </span>
                        <Popup
                          inverted
                          style={{opacity: '0.8'}}
                          className={styles.popup}
                          trigger={
                            <span className={styles['tooltip-text']}>{ item.comment }</span>
                          }
                          content={
                            <div className={styles.tooltip}>
                              {item.comment}
                            </div>
                          }
                          position='top left'
                        />
                      </div>
                    }
                  </div>
                </div>
              )
            })
          }
          {
            hasMore && versions.length !== 0 && (
              <div className={styles.hasMore} onClick={loadMore}>
                <FormattedMessage id='targeting.view.more' />
              </div>
            )
          }
          {
            versions.length === 0 && (
              <div className={styles['no-data']}>
                <img className={styles['no-data-image']} src={require('images/no-data.png')} alt='no-data' />
                <FormattedMessage id='common.nodata.text' />
              </div>
            )
          }
        </InfiniteScroll>
      </div>
    </div>
  )
};

export default History;