import { PlusOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import { Button, message, Modal, Input, Select, DatePicker } from "antd";
import React, { useState, useRef, useEffect } from "react";
import { FormattedMessage, useModel } from "umi";
import WrapContent from "@/components/WrapContent";
import type { ProColumns, ActionType } from "@ant-design/pro-table";
import ProTable from "@ant-design/pro-table";
import { getNamespaces } from "@/services/kubeedge";
import type { DeptType, formType, listType } from "./data";
import {
  getList,
  removeItem,
  getRuleendpoints,
  addItem,
  getYaml,
} from "./service";
import UpdateForm from "./components/edit";
import Yaml from "./components/yaml";

const { RangePicker } = DatePicker;

const handleAdd = async (fields: formType) => {
  const hide = message.loading("Adding...");
  try {
    const obj = {
      apiVersion: "rules.kubeedge.io/v1",
      kind: "Rule",
      metadata: {
        name: fields.name,
        namespace: fields.namespace,
        labels: {
          description: fields.description,
        },
      },
      spec: {
        source: fields.source,
        sourceResource: {
          path: fields.sourceResource,
        },
        target: fields.target,
        targetResource: {
          path: fields.targetResource,
        },
      },
    };
    const resp = await addItem(fields.namespace, obj);
    hide();
    if (resp.metadata?.creationTimestamp) {
      message.success("Added successfully");
    } else {
      message.error(resp.msg);
    }
    return true;
  } catch (error) {
    hide();
    message.error("Failed, please try again!");
    return false;
  }
};

const handleRemoveOne = async (selectedRow: listType) => {
  const hide = message.loading("Deleting...");
  if (!selectedRow) return true;
  try {
    const resp = await removeItem(selectedRow.namespace, selectedRow.name);
    hide();
    if (resp.status === "Success" || resp.metadata?.name === selectedRow.name) {
      message.success("Successfully deleted, about to refresh");
    } else {
      message.error(resp.msg);
    }
    return true;
  } catch (error) {
    hide();
    message.error("Deletion failed, please try again");
    return false;
  }
};

const DeptTableList: React.FC = () => {
  const formTableRef = useRef<FormInstance>();
  const { initialState } = useModel("@@initialState");

  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<listType>();
  const [ruleEndpoints, setRuleEndpoints] = useState([]);

  const [yamlVisible, setYamlVisible] = useState<boolean>(false);
  const [currentYaml, setCurrentYaml] = useState<listType>();

  const [namespacesList, setNamespacesList] = React.useState<any[]>([]);

  const initNamespacesList = async () => {
    const namespacesListRes = await getNamespaces();
    setNamespacesList([
      {
        label: "All namespaces",
        value: "",
      },
      ...(namespacesListRes?.items || []).map((item: any) => {
        return { label: item.metadata.name, value: item.metadata.name };
      }),
    ]);
  };

  useEffect(() => {
    getRuleendpoints(initialState?.namespace).then((res) => {
      const ruleEndpointsList = res.items.map((item) => {
        return { label: item.metadata.name, value: item.metadata.name };
      });
      setRuleEndpoints(ruleEndpointsList);
    });
    if (initialState?.namespace === "") {
      initNamespacesList();
    } else {
      setNamespacesList([
        {
          label: initialState.namespace,
          value: initialState.namespace,
        },
      ]);
    }
    formTableRef.current?.resetFields();
  }, [initialState]);

  const columns: ProColumns<listType>[] = [
    {
      title: "Namespace",
      dataIndex: "namespace",
      valueType: "text",
      align: "center",
      formItemProps: {
        labelCol: { span: 8 },
      },
      renderFormItem: () => (
        <Select
          id={`${initialState.namespace}-select`}
          placeholder={"Please select namespace"}
          mode="multiple"
          allowClear
          options={namespacesList}
        />
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      valueType: "text",
      renderFormItem: () => (
        <Input
          allowClear
          placeholder="Please enter name"
          style={{ width: 160 }}
        />
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      valueType: "text",
      search: false,
    },
    {
      title: "SourceResource",
      dataIndex: "sourceResource",
      valueType: "text",
      search: false,
    },
    {
      title: "Target",
      dataIndex: "target",
      valueType: "text",
      search: false,
    },
    {
      title: "TargetResource",
      dataIndex: "targetResource",
      valueType: "text",
      search: false,
    },
    {
      title: "Creation time",
      dataIndex: "creationTimestamp",
      valueType: "dateTime",
      formItemProps: {
        labelCol: { span: 9 },
      },
      renderFormItem: () => (
        <RangePicker
          style={{ width: 220 }}
          allowClear
          placeholder={["Start Time", "End Time"]}
          showTime={{ format: "HH:mm:ss" }}
          format="YYYY-MM-DD HH:mm:ss"
        />
      ),
    },
    {
      title: "Operation",
      dataIndex: "option",
      width: "220px",
      valueType: "option",
      render: (_, record) => [
        <Button
          type="link"
          size="small"
          key="batchRemove"
          onClick={async () => {
            const res = await getYaml(record.namespace, record.name);
            setCurrentYaml(res);
            setYamlVisible(true);
          }}
        >
          YAML
        </Button>,
        <Button
          type="link"
          size="small"
          danger
          key="batchRemove"
          onClick={async () => {
            Modal.confirm({
              title: "Delete",
              content: "Are you sure to delete this item?",
              onOk: async () => {
                const success = await handleRemoveOne(record);
                if (success) {
                  if (actionRef.current) {
                    actionRef.current.reload();
                  }
                }
              },
            });
          }}
        >
          Delete
        </Button>,
      ],
    },
  ];

  return (
    <WrapContent>
      <div style={{ width: "100%", float: "right" }}>
        <ProTable<listType>
          headerTitle="Rule"
          actionRef={actionRef}
          formRef={formTableRef}
          rowKey="deptId"
          key="deptList"
          search={{ labelWidth: 120 }}
          toolBarRender={() => [
            <Button
              type="primary"
              key="add"
              onClick={async () => {
                setCurrentRow(undefined);
                setModalVisible(true);
              }}
            >
              <PlusOutlined />
              {"Add Rule"}
            </Button>,
          ]}
          params={{ namespaceSetting: initialState.namespace }}
          request={(params) =>
            getList(params.namespaceSetting).then((res) => {
              const combinedParams = {
                ...params,
                ...formTableRef?.current?.getFieldsValue?.(),
              };
              let filteredRes = res.items;
              let ruleList: any[] = [];
              if (
                combinedParams.namespace?.length ||
                combinedParams.name ||
                combinedParams.creationTimestamp
              ) {
                filteredRes = res.items.filter((item: any) => {
                  let namespaceMatch = true;
                  let nameMatch = true;
                  let creationTimestampMatch = true;
                  if (combinedParams.namespace) {
                    namespaceMatch =
                      combinedParams.namespace.includes("") ||
                      combinedParams.namespace.includes(
                        item.metadata.namespace
                      );
                  }
                  if (combinedParams.name) {
                    nameMatch = item.metadata.name.includes(
                      combinedParams.name
                    );
                  }
                  if (combinedParams.creationTimestamp) {
                    const start = new Date(combinedParams.creationTimestamp[0]);
                    const end = new Date(combinedParams.creationTimestamp[1]);
                    const creationTimestamp = new Date(
                      item.metadata.creationTimestamp
                    );
                    creationTimestampMatch =
                      creationTimestamp >= start && creationTimestamp <= end;
                  }
                  return namespaceMatch && nameMatch && creationTimestampMatch;
                });
              }
              filteredRes.forEach(
                (item: { metadata: any; spec: any; status: any }) => {
                  ruleList.push({
                    name: item.metadata.name,
                    namespace: item.metadata.namespace,
                    uid: item.metadata.uid,
                    creationTimestamp: item.metadata.creationTimestamp,
                    source: item.spec.source,
                    sourceResource: item.spec.sourceResource.path,
                    target: item.spec.target,
                    targetResource: item.spec.targetResource.path,
                  });
                }
              );
              return {
                data: ruleList,
                total: ruleList.length,
                success: true,
              };
            })
          }
          columns={columns}
        />
      </div>
      <UpdateForm
        onSubmit={async (values) => {
          let success = false;
          success = await handleAdd({ ...values } as formType);
          if (success) {
            setModalVisible(false);
            setCurrentRow(undefined);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
        onCancel={() => {
          setModalVisible(false);
          setCurrentRow(undefined);
        }}
        ruleEndpoints={ruleEndpoints}
        visible={modalVisible}
        values={currentRow || {}}
      />
      <Yaml
        onSubmit={async (values) => {
          setYamlVisible(false);
          setCurrentYaml(undefined);
          if (actionRef.current) {
            actionRef.current.reload();
          }
        }}
        onCancel={() => {
          setYamlVisible(false);
          setCurrentYaml(undefined);
        }}
        visible={yamlVisible}
        values={currentYaml || {}}
      />
    </WrapContent>
  );
};

export default DeptTableList;
