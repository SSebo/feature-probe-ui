import request from '../utils/request';
import qs from 'qs';
import API from '../constants/api';
import { IEnvironment, IProject, IExistParams } from 'interfaces/project';
import { ApplicationJson } from 'constants/api/contentType';

export const getProjectList = async<T> () => {
  const url = API.getProjectListURI;
  
  return request<T>(url, {
    method: 'GET',
    headers: {
      ...ApplicationJson()
    },
  });
}

export const getProjectInfo = async<T> (projectKey: string) => {
  const url = `${
    API.getProjectInfoURI
      .replace(':projectKey', projectKey)
  }`;
  
  return request<T>(url, {
    method: 'GET',
    headers: {
      ...ApplicationJson()
    },
  });
};

export const addProject = async (data: IProject) => {
  const url = API.addProjectURI;

  return request(url, {
    method: 'POST',
    headers: {
      ...ApplicationJson()
    },
    body: JSON.stringify(data),
  });
};

export const editProject = async(projectKey: string, data: IProject) => {
  const url = `${
    API.editProjectURI
      .replace(':projectKey', projectKey)
  }`;

  return request(url, {
    method: 'PATCH',
    headers: {
      ...ApplicationJson()
    },
    body: JSON.stringify(data),
  });
};

export const addEnvironment = async(projectKey: string, data: IEnvironment) => {
  const url = `${
    API.addEnvironmentURI
      .replace(':projectKey', projectKey)
  }`;

  return request(url, {
    method: 'POST',
    headers: {
      ...ApplicationJson()
    },
    body: JSON.stringify(data),
  });
};

export const editEnvironment = async(projectKey: string, environmentKey: string, data: IEnvironment) => {
  const url = `${
    API.editEnvironmentURI
      .replace(':projectKey', projectKey)
      .replace(':environmentKey', environmentKey)
  }`;

  return request(url, {
    method: 'PATCH',
    headers: {
      ...ApplicationJson()
    },
    body: JSON.stringify(data),
  });
};

export const getEnvironment = async<T> (projectKey: string, environmentKey: string) => {
  const url = `${
    API.editEnvironmentURI
      .replace(':projectKey', projectKey)
      .replace(':environmentKey', environmentKey)
  }`;

  return request<T>(url, {
    method: 'GET',
    headers: {
      ...ApplicationJson()
    },
  });
};

export const checkProjectExist = async<T> (params: IExistParams) => {
  const url = `${API.projectExistURI}?${qs.stringify(params)}`;
  
  return request<T>(url, {
    method: 'GET',
    headers: {
      ...ApplicationJson()
    },
  });
}