import { SyntheticEvent, useEffect, useState, useCallback, useRef } from 'react';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { Menu, MenuItemProps } from 'semantic-ui-react';
import localForage from 'localforage';
import useResizeObserver from 'use-resize-observer';
import { FormattedMessage, useIntl } from 'react-intl';
import cloneDeep from 'lodash/cloneDeep';
import findIndex from 'lodash/findIndex';
import Modal from 'components/Modal';
import message from 'components/MessageBox';
import Button from 'components/Button';
import Icon from 'components/Icon';
import ProjectLayout from 'layout/projectLayout';
import TargetingForm from './components/TargetingForm';
import Metrics from './components/Metrics';
import Info from './components/Info';
import History from './components/History';
import { Provider } from './provider';
import { getSegmentList } from 'services/segment';
import { getTargeting, getToggleInfo, getTargetingVersion, getTargetingVersionsByVersion } from 'services/toggle';
import { ISegmentList } from 'interfaces/segment';
import { IRouterParams, IVersionParams } from 'interfaces/project';
import { IToggleInfo, ITarget, IContent, IModifyInfo, ITargetingVersions, IVersion, ITargetingVersionsByVersion } from 'interfaces/targeting';
import { NOT_FOUND } from 'constants/httpCode';
import styles from './index.module.scss';

const Targeting = () => {
  const { search } = useLocation();
  const history = useHistory();
  const intl = useIntl();
  const formRef = useRef();
  const currentVersion = Number(new URLSearchParams(search).get('currentVersion'));

  const { projectKey, environmentKey, toggleKey, navigation } = useParams<IRouterParams>();
  const [ activeItem, saveActiveItem ] = useState(navigation || 'targeting');
  const [ toggleInfo, saveToggleInfo ] = useState<IToggleInfo>();
  const [ targeting, saveTargeting ] = useState<ITarget>();
  const [ segmentList, saveSegmentList ] = useState<ISegmentList>();
  const [ toggleDisabled, saveToggleDisable ] = useState<boolean>(false);
  const [ initialTargeting, saveInitTargeting ] = useState<IContent>();
  const [ historyOpen, setHistoryOpen ] = useState<boolean>(false);
  const [ modifyInfo, saveModifyInfo ] = useState<IModifyInfo>();
  const [ versions, saveVersions ] = useState<IVersion[]>([]);
  const [ historyPageIndex, saveHistoryPageIndex ] = useState<number>(0);
  const [ historyHasMore, saveHistoryHasMore ] = useState<boolean>(false);
  const [ targetingDisabled, saveTargetingDisabled ] = useState<boolean>(false);
  const [ selectedVersion, saveSelectedVersion ] = useState<number>(0);
  const [ latestVersion, saveLatestVersion ] = useState<number>(0);
  const [ open, setPageLeaveOpen ] = useState<boolean>(false);
  const [ rememberVersion, saveRememberVersion ] = useState<boolean>(false);
  const [ pageInitCount, saveCount ] = useState<number>(0);
  const [ activeVersion, saveActiveVersion ] = useState<IVersion>();
  const { ref, height = 1 } = useResizeObserver<HTMLDivElement>();

  useEffect(() => {
    if (projectKey) {
      localForage.setItem('projectKey', projectKey);
    }
    if (environmentKey) {
      localForage.setItem('environmentKey', environmentKey);
    }
  }, [projectKey, environmentKey]);

  useEffect(() => {
    saveActiveItem(navigation);
  }, [navigation]);

  const initTargeting = useCallback(() => {
    getTargeting<IContent>(projectKey, environmentKey, toggleKey).then(res => {
      const { data, success } = res;
      if (success && data) {
        const { version, content, disabled, modifiedBy, modifiedTime } = data;
        saveTargeting(cloneDeep(content));
        saveToggleDisable(disabled || false);
        saveInitTargeting(cloneDeep({
          disabled,
          content,
        }));
        saveModifyInfo({
          modifiedBy,
          modifiedTime,
        });
        saveLatestVersion(version || 0);
        saveSelectedVersion(version || 0);
      } else {
        message.error(res.message || intl.formatMessage({id: 'toggles.targeting.error.text'}));
      }
    });
  }, [intl, projectKey, environmentKey, toggleKey]);

  const initToggleInfo = useCallback(() => {
    getToggleInfo<IToggleInfo>(projectKey, environmentKey, toggleKey).then(async(res) => {
      const { data, success, code } = res;
      if (success && data) {
        saveToggleInfo(data);
      } else if (!success && code === NOT_FOUND) {
        await localForage.removeItem('projectKey');
        await localForage.removeItem('environmentKey');
        history.push('/notfound');
        return;
      } else {
        message.error(res.message || intl.formatMessage({id: 'toggles.info.error.text'}));
      }
    });
  }, [intl, projectKey, environmentKey, toggleKey, history]);

  const initSegmentList = useCallback(() => {
    getSegmentList<ISegmentList>(projectKey, {
      pageIndex: 0,
      pageSize: 10,
    }).then(async (res) => {
      const { success, data } = res;
      if (success) {
        saveSegmentList(data);
      }
    });
  }, [projectKey]);

  useEffect(() => {
    initToggleInfo();
    initTargeting();
    initSegmentList();
  }, [initToggleInfo, initTargeting, initSegmentList]);

  const getVersionsByVersion = useCallback(async () => {
    const res = await getTargetingVersionsByVersion<ITargetingVersionsByVersion>(
      projectKey, 
      environmentKey, 
      toggleKey, 
      currentVersion
    );

    const { data, success } = res;
    if (success && data) {
      saveVersions(data.versions);
      const index = findIndex(data.versions, function(version: IVersion) {
        return version.version === currentVersion;
      });

      if (index > -1) {
        const current = data.versions[index];
        saveSelectedVersion(current?.version || 0);
        saveTargeting(cloneDeep(current?.content));
        saveInitTargeting(cloneDeep({
          disabled: current.disabled,
          content: current.content,
        }));

        saveToggleDisable(current.disabled);

        // current version === latest version
        if (index === 0) {
          saveTargetingDisabled(false);
        } 
        else {
          saveTargetingDisabled(true);
        }
      }

      saveHistoryPageIndex(0);
      saveHistoryHasMore(data.versions.length !== data.total);
    } else {
      message.error(res.message || intl.formatMessage({id: 'targeting.get.versions.error'}));
    }
  }, [currentVersion, projectKey, environmentKey, toggleKey, intl]);

  useEffect(() => {
    if (currentVersion) {
      setHistoryOpen(true);
      getVersionsByVersion();
      saveRememberVersion(true);
    }
  }, [currentVersion, getVersionsByVersion]);

  const getVersionsList = useCallback(() => {
    const params: IVersionParams = {
      pageIndex: historyPageIndex,
      pageSize: 10,
    };
    if (rememberVersion) {
      params.version = currentVersion;
    }
    getTargetingVersion<ITargetingVersions>(
      projectKey, 
      environmentKey, 
      toggleKey, 
      params,
    ).then(res => {
      const { data, success } = res;
      if (success && data) {
        const { content, number, totalPages } = data;
        saveVersions(versions.concat(content));
        saveHistoryPageIndex(historyPageIndex + 1);
        saveHistoryHasMore((number + 1) !== totalPages);
      } else {
        message.error(res.message || intl.formatMessage({id: 'targeting.get.versions.error'}));
      }
    });
  }, [versions, currentVersion, rememberVersion, historyPageIndex, projectKey, environmentKey, toggleKey, intl]);

  const reviewHistory = useCallback((version: IVersion) => {
    saveActiveVersion(version);
    if (pageInitCount === 0 && !formRef.current) {
      setPageLeaveOpen(true);
      return;
    }
    saveCount(pageInitCount + 1);
    saveSelectedVersion(version?.version || 0);
    saveTargeting(cloneDeep(version?.content));
    saveInitTargeting(cloneDeep({
      disabled: version.disabled,
      content: version.content,
    }));
    saveToggleDisable(version.disabled);
    if (version.version === latestVersion) {
      saveCount(0);
      saveTargetingDisabled(false);
    } else {
      saveTargetingDisabled(true);
    }
  }, [pageInitCount, latestVersion]);

  const quiteReviewHistory = useCallback(() => {
    saveCount(0);
    saveTargetingDisabled(false);
    const current = versions[0];
    if (current) {
      reviewHistory(current);
    }
  }, [versions, reviewHistory]);
  
  const confirmReviewHistory = useCallback(() => {
    saveSelectedVersion(activeVersion?.version || 0);
    saveTargeting(cloneDeep(activeVersion?.content));
    saveInitTargeting(cloneDeep({
      disabled: activeVersion?.disabled,
      content: activeVersion?.content,
    }));
    saveToggleDisable(activeVersion?.disabled || false);
    saveTargetingDisabled(true);
    setPageLeaveOpen(false);
  }, [activeVersion]);

  const resetHistory = useCallback(() => {
    initTargeting();
    saveTargetingDisabled(false);
    saveCount(0);
    saveHistoryPageIndex(0);
    setHistoryOpen(false);
    saveVersions([]);
    saveRememberVersion(false);
  }, [initTargeting]);

  const initHistory = useCallback(() => {
    saveVersions([]);
    saveHistoryPageIndex(0);
    saveRememberVersion(false);
    getVersionsList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleItemClick = useCallback((e: SyntheticEvent, value: MenuItemProps) => {
    history.push(`/${projectKey}/${environmentKey}/${toggleKey}/${value.name}`);
    resetHistory();
  }, [history, projectKey, environmentKey, toggleKey, resetHistory]);

  const gotoGetStarted = useCallback(() => {
    history.push(`/${projectKey}/${environmentKey}/${toggleKey}/get-started`);
  }, [history, projectKey, environmentKey, toggleKey]);

	return (
    <ProjectLayout>
      <Provider>
        <div className={styles.targeting}>
          <Info
            toggleInfo={toggleInfo}
            modifyInfo={modifyInfo}
            gotoGetStarted={gotoGetStarted}
          />
          <div className={styles.menus}>
            <Menu pointing secondary className={styles.menu}>
              <Menu.Item
                name='targeting'
                active={activeItem === 'targeting'}
                onClick={handleItemClick}
              >
                <FormattedMessage id='common.targeting.text' />
              </Menu.Item>
              <Menu.Item
                name='metrics'
                active={activeItem === 'metrics'}
                onClick={handleItemClick}
              >
                <FormattedMessage id='common.metrics.text' />
              </Menu.Item>
            </Menu>
            {
              activeItem === 'targeting' && (
                <div className={styles.history}>
                  <Button 
                    primary
                    type='button'
                    onClick={(e: SyntheticEvent) => {
                      setHistoryOpen(!historyOpen);
                      if (!versions.length) {
                        getVersionsList();
                      }
                    }}
                  >
                    {
                      historyOpen 
                        ? <Icon type='put-up' customClass={styles['put-away']} /> 
                        : <Icon type='put-away' customClass={styles['put-away']} /> 
                    }
                    <FormattedMessage id='common.history.text' />
                  </Button>
                </div>
              )
            }
          </div>
          <div className={styles.content}>
            <div className={styles['content-left']}>
              {
                activeItem === 'targeting' && (
                  <div id='targetingForm' ref={ref}>
                    {
                      targetingDisabled && (
                        <div className={styles.message}>
                          <div className={`${styles['message-content-warn']} ${styles['message-content']}`}>
                            <i className={`${styles['icon-warning-circle']} icon-warning-circle iconfont`}></i>
                            <span className={styles['message-content-text']}>
                              <FormattedMessage id='targeting.view.versions' />
                              <FormattedMessage id='common.version.text' />:
                              { selectedVersion }
                            </span>
                            <Icon type='close' customClass={styles['close-icon']} onClick={() => quiteReviewHistory()} />
                          </div>
                        </div>
                      )
                    }
                    <TargetingForm
                      disabled={targetingDisabled}
                      targeting={targeting}
                      toggleInfo={toggleInfo}
                      segmentList={segmentList}
                      toggleDisabled={toggleDisabled}
                      initialTargeting={initialTargeting}
                      initTargeting={() => {
                        initTargeting();
                        initHistory();
                      }}
                      saveToggleDisable={saveToggleDisable}
                      ref={formRef}
                    />
                  </div>
                )
              }
              {
                activeItem === 'metrics' && (
                  <Metrics />
                )
              }
            </div>
            {
              historyOpen && (
                <div className={styles['content-right']} style={{ height }}>
                  <History 
                    versions={versions}
                    hasMore={historyHasMore}
                    latestVersion={latestVersion}
                    selectedVersion={selectedVersion}
                    loadMore={() => {
                      getVersionsList();
                    }}
                    reviewHistory={reviewHistory}
                    setHistoryOpen={setHistoryOpen}
                  />
                </div>
              )
            }
          </div>
          <Modal 
            open={open}
            width={400}
            handleCancel={() => {setPageLeaveOpen(false)}}
            handleConfirm={confirmReviewHistory}
          >
            <div>
              <div className={styles['modal-header']}>
                <Icon customClass={styles['warning-circle']} type='warning-circle' />
                <span className={styles['modal-header-text']}>
                  <FormattedMessage id='sidebar.modal.title' />
                </span>
              </div>
              <div className={styles['modal-content']}>
                <FormattedMessage id='targeting.page.leave.text' />
              </div>
            </div>
          </Modal>
        </div>
      </Provider>
    </ProjectLayout>
	)
}

export default Targeting;
