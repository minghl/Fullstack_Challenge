import { CloudDownloadOutlined, PlusOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { Menu, Form, Modal, Input, Select } from 'antd';
import { useState } from 'react';
import newRequest from "../utils/newRequest.js";
const items = [
    {
        label: 'Add New Technology',
        key: '1',
        icon: <PlusOutlined />,
    },
    {
        label: 'Save Tech Radar to Database',
        key: '2',
        icon: <SaveOutlined />,
    },
    {
        label: 'Reset Tech Radar',
        key: '3',
        icon: <DeleteOutlined />,
    },
    {
        label: 'Load Tech Radar From Database',
        key: '4',
        icon: <CloudDownloadOutlined />
    },
];



const TopMenu = (props) => {
    const [current, setCurrent] = useState('mail');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [type, setType] = useState('');
    const [importance, setImportance] = useState('');
    const [name, setName] = useState('');

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        const addRadar = async () => {
            try {
                await newRequest.post(`/radars`, {
                    quadrant: type,
                    ring: importance,
                    label: name,
                    active: 1,
                    moved: 0,
                    desc: null,
                    id: props.entries.length + 1,
                    link: null,
                });
            } catch (err) { }
        };
        addRadar();

        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const onClick = (e) => {
        console.log('click ', e);
        setCurrent(e.key);
        if (e.key === '1') {
            console.log(123123);
            showModal();
        }
    };

    const onTypeChange = (e) => {
        console.log(e, 'e');
        setType(e);
    };

    const onImpoChange = (e) => {
        console.log(e, 'er');
        setImportance(e);
    }

    const onNameChange = (e) => {
        console.log(e.target.value, 'na');
        setName(e.target.value);
    }

    console.log(props, 'props');
    const { Option } = Select;
    return <>
        <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={items} />
        <Modal title="Add New Technology" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
            <Form>
                <Form.Item label="Technology Name">
                    <Input onChange={onNameChange} />
                </Form.Item>
                <Form.Item label="Technology Type">
                    <Select
                        placeholder="Select a technology type"
                        onChange={onTypeChange}
                        allowClear
                    >
                        <Option value="1">Infrastructure</Option>
                        <Option value="2">Datastores</Option>
                        <Option value="3">Data Management</Option>
                        <Option value="4">Languages</Option>
                    </Select>
                </Form.Item>
                <Form.Item label="Technology Importance">
                    <Select
                        placeholder="Select a technology importance"
                        onChange={onImpoChange}
                        allowClear
                    >
                        <Option value="0">Adopt</Option>
                        <Option value="1">Trial</Option>
                        <Option value="2">Assess</Option>
                        <Option value="3">Hold</Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    </>;
};
export default TopMenu;