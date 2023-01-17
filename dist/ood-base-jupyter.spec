%define app_path /www/ood/apps/sys/

Name:           ood-base-jupyter
Version:        R12
Release:        1%{?dist}
Summary:        Open on Demand jupyter application

BuildArch:      noarch

License:        MIT
Source:         %{name}-%{version}.tar.bz2

Requires:       ondemand
Requires:       ood-util

# Disable debuginfo
%global debug_package %{nil}

%description
Open on Demand jupyter application.

%prep
%setup -q

%build

%install

%__install -m 0755 -d %{buildroot}%{_localstatedir}%{app_path}%{name}/template
%__install -m 0644 -D template/* %{buildroot}%{_localstatedir}%{app_path}%{name}/template
%__install -m 0644 manifest.yml *.js *.erb icon.png README.md LICENSE.txt %{buildroot}%{_localstatedir}%{app_path}%{name}/

%files

%{_localstatedir}%{app_path}%{name}

%changelog
* Tue Dec 20 2022 Sami Ilvonen <sami.ilvonen@csc.fi>
- Initial test version
