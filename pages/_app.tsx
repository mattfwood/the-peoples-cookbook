import React from 'react';
import App from 'next/app';
import { TinaCMS, TinaProvider } from 'tinacms';
import { GithubClient, TinacmsGithubProvider } from 'react-tinacms-github';

import '../styles/base.css';
import '../styles/index.css';
import Link from 'next/link';
import { RecipeCreatorPlugin } from '../lib/RecipeCreatorPlugin';
import { MarkdownFieldPlugin } from 'react-tinacms-editor';

export default class Site extends App {
  cms: TinaCMS;

  constructor(props) {
    super(props);
    /**
     * 1. Create the TinaCMS instance
     */
    this.cms = new TinaCMS({
      enabled: !!props.pageProps.preview,
      apis: {
        /**
         * 2. Register the GithubClient
         */
        github: new GithubClient({
          proxy: '/api/proxy-github',
          authCallbackRoute: '/api/create-github-access-token',
          clientId: process.env.GITHUB_CLIENT_ID,
          baseRepoFullName: process.env.REPO_FULL_NAME, // e.g: tinacms/tinacms.org,
        }),
      },
      /**
       * 3. Use the Sidebar and Toolbar
       */
      sidebar: props.pageProps.preview,
      toolbar: props.pageProps.preview,
      plugins: [MarkdownFieldPlugin, RecipeCreatorPlugin],
    });
  }

  render() {
    const { Component, pageProps } = this.props;
    return (
      /**
       * 4. Wrap the page Component with the Tina and Github providers
       */
      <TinaProvider cms={this.cms}>
        <TinacmsGithubProvider
          onLogin={onLogin}
          onLogout={onLogout}
          error={pageProps.error}
        >
          {/**
           * 5. Add a button for entering Preview/Edit Mode
           */}
          <div className="max-w-3xl mx-auto px-4 py-2 sm:px-6 xl:max-w-5xl xl:px-0">
            <h1 className="text-3xl leading-9 font-extrabold text-gray-900 tracking-tight sm:leading-10 md:leading-14 my-4">
              <Link href="/">
                <a>The People's Cookbook</a>
              </Link>
            </h1>
            <EditLink cms={this.cms} />
            <Component {...pageProps} />
          </div>
        </TinacmsGithubProvider>
      </TinaProvider>
    );
  }
}

const onLogin = async () => {
  const token = localStorage.getItem('tinacms-github-token') || null;
  const headers = new Headers();

  if (token) {
    headers.append('Authorization', 'Bearer ' + token);
  }

  const resp = await fetch(`/api/preview`, { headers: headers });
  const data = await resp.json();

  if (resp.status === 200) window.location.href = window.location.pathname;
  else throw new Error(data.message);
};

const onLogout = () => {
  return fetch(`/api/reset-preview`).then(() => {
    window.location.reload();
  });
};

export interface EditLinkProps {
  cms: TinaCMS;
}

export const EditLink = ({ cms }: EditLinkProps) => {
  return (
    <button className="btn-blue" onClick={() => cms.toggle()}>
      {cms.enabled ? 'Exit Edit Mode' : 'Edit This Site'}
    </button>
  );
};
